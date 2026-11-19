"""Exercise the public x64 installer against a real Win32 window underneath the island."""
import ctypes
from ctypes import wintypes as wt
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import time
import tkinter as tk
import urllib.request


def installer_for(tag, directory):
    if not re.fullmatch(r"v[0-9]+\.[0-9]+\.[0-9]+", tag):
        raise ValueError("Expected a desktop release tag such as v0.3.51")
    repo = "CaliBG/agent-island"
    filename = f"Agent-Island-{tag[1:]}-win-x64.exe"
    with urllib.request.urlopen(f"https://api.github.com/repos/{repo}/releases/tags/{tag}", timeout=30) as response:
        release = json.load(response)
    asset = next(asset for asset in release["assets"] if asset["name"] == filename)
    path = directory / filename
    digest = hashlib.sha256()
    with urllib.request.urlopen(f"https://github.com/{repo}/releases/download/{tag}/{filename}", timeout=90) as source, path.open("wb") as target:
        while block := source.read(1024 * 1024):
            digest.update(block)
            target.write(block)
    if asset.get("digest") != "sha256:" + digest.hexdigest():
        raise RuntimeError("Installer SHA-256 differs from the GitHub release asset")
    return path


def dll_function(lib, name, argtypes, restype):
    fn = getattr(lib, name)
    fn.argtypes = argtypes
    fn.restype = restype
    return fn


def check_window(executable, env):
    user = ctypes.WinDLL("user32", use_last_error=True)
    gdi = ctypes.WinDLL("gdi32", use_last_error=True)
    hwnd, handle, cint, uint = wt.HWND, wt.HANDLE, ctypes.c_int, wt.UINT
    byref = ctypes.byref
    enum_proc = ctypes.WINFUNCTYPE(wt.BOOL, hwnd, wt.LPARAM)
    enum_windows = dll_function(user, "EnumWindows", [enum_proc, wt.LPARAM], wt.BOOL)
    visible = dll_function(user, "IsWindowVisible", [hwnd], wt.BOOL)
    pid_for = dll_function(user, "GetWindowThreadProcessId", [hwnd, ctypes.POINTER(wt.DWORD)], wt.DWORD)
    create_rgn = dll_function(gdi, "CreateRectRgn", [cint, cint, cint, cint], handle)
    delete = dll_function(gdi, "DeleteObject", [handle], wt.BOOL)
    get_rgn = dll_function(user, "GetWindowRgn", [hwnd, handle], cint)
    rgn_box = dll_function(gdi, "GetRgnBox", [handle, ctypes.POINTER(wt.RECT)], cint)
    get_rect = dll_function(user, "GetWindowRect", [hwnd, ctypes.POINTER(wt.RECT)], wt.BOOL)
    from_point = dll_function(user, "WindowFromPoint", [wt.POINT], hwnd)
    dpi = dll_function(user, "GetDpiForWindow", [hwnd], uint)
    move = dll_function(user, "SetCursorPos", [cint, cint], wt.BOOL)
    click = dll_function(user, "mouse_event", [wt.DWORD] * 4 + [ctypes.c_size_t], None)
    key = dll_function(user, "keybd_event", [wt.BYTE, wt.BYTE, wt.DWORD, ctypes.c_size_t], None)
    dll_function(user, "SetThreadDpiAwarenessContext", [handle], handle)(ctypes.c_void_p(-4))

    def pid_of(win):
        pid = wt.DWORD()
        pid_for(win, byref(pid))
        return pid.value

    def region(win):
        r = create_rgn(0, 0, 0, 0)
        try:
            box = wt.RECT()
            if not get_rgn(win, r) or not rgn_box(r, byref(box)):
                return None
            return box
        finally:
            delete(r)

    article = tk.Tk()
    article.title("Reading window")
    article.overrideredirect(True)
    article.geometry(f"{article.winfo_screenwidth()}x{article.winfo_screenheight()}+0+0")
    article.configure(background="#eeeeee")
    clicks = []
    article.bind("<ButtonPress-1>", lambda event: clicks.append((event.x_root, event.y_root)))
    article.update()
    article.lift()
    article.focus_force()
    move(32, 100)
    process = subprocess.Popen([executable, "--background"], env=env)

    def wait(check, description, timeout=15):
        until = time.monotonic() + timeout
        while time.monotonic() < until:
            article.update()
            value = check()
            if value:
                return value
            if process.poll() is not None:
                raise RuntimeError(f"Application exited ({process.returncode}) while waiting for {description}")
            time.sleep(0.025)
        raise TimeoutError(description)

    def find_island():
        result = []
        @enum_proc
        def visit(win, _):
            if visible(win) and pid_of(win) == process.pid and region(win) is not None:
                result.append(win)
            return True
        enum_windows(visit, 0)
        return result[0] if result else None

    def tap():
        click(0x0002, 0, 0, 0, 0)
        click(0x0004, 0, 0, 0, 0)

    def shortcut():
        sequence = (0x11, 0x10, 0x20)  # Ctrl + Shift + Space
        for vk in sequence:
            key(vk, 0, 0, 0)
        for vk in reversed(sequence):
            key(vk, 0, 2, 0)

    try:
        island = wait(find_island, "visible native window with a shape", timeout=40)
        scale = dpi(island) / 96
        assert scale > 0, "Unable to read window DPI"
        window = wt.RECT()
        assert get_rect(island, byref(window))

        def shape(compact):
            r = region(island)
            if not r:
                return False
            w, h = r.right - r.left, r.bottom - r.top
            if compact:
                return r if abs(w - 64 * scale) <= 1 and abs(h - 6 * scale) <= 1 else None
            return r if abs(w - 448 * scale) <= 2 and h > 60 * scale else None

        r = wait(lambda: shape(True), "64 by 6 DIP collapsed native region")
        x = window.left + (r.left + r.right) // 2
        y = window.top + (r.top + r.bottom) // 2
        assert window.top + r.top == 0, "Strip must touch the primary screen top"
        assert abs(x - article.winfo_screenwidth() / 2) <= 1, "Strip must be centred"
        assert pid_of(from_point(wt.POINT(x, y))) == process.pid, "Strip hit should belong to AISLAND"
        under_y = window.top + r.bottom + 1
        outer_x = window.left + r.right + 2
        for point in [(x, under_y), (outer_x, y)]:
            assert pid_of(from_point(wt.POINT(*point))) == os.getpid(), f"Reading window should own {point}"
            assert move(*point)
            before = len(clicks)
            tap()
            wait(lambda: len(clicks) > before, "reading window to receive the click")
        print("PASS  Top-centred native capsule and click-through below and beside it", flush=True)

        assert move(x, y)
        wait(lambda: shape(False), "native hover expansion with ordinary hover disabled")
        before = len(clicks)
        assert pid_of(from_point(wt.POINT(x, y))) == process.pid
        tap()
        assert move(32, 100)
        wait(lambda: shape(True), "native collapse after cursor leaves")
        assert len(clicks) == before, "Click on the island leaked into the reading window"
        print("PASS  Hover, expansion, pointer ownership and collapse", flush=True)

        shortcut()
        wait(lambda: shape(False), "expansion via the global shortcut")
        shortcut()
        wait(lambda: shape(True), "collapse via the global shortcut")
        print("PASS  Global keyboard shortcut", flush=True)
    finally:
        try:
            if process.poll() is None:
                subprocess.run(["taskkill", "/PID", str(process.pid), "/T", "/F"], check=False, capture_output=True)
                process.wait(timeout=10)
        finally:
            article.destroy()


def main():
    tag = os.environ["AISLAND_RELEASE_TAG"]
    with tempfile.TemporaryDirectory(prefix="aisland-release-") as tmp:
        temp = Path(tmp)
        installer = installer_for(tag, temp)
        install = temp / "install"
        home = temp / "profile"
        home.mkdir()
        settings = {"windowsMinimized": True, "position": "floating", "hoverEnabled": False,
                    "notifications": False, "sound": False, "layoutVersion": 2, "motion": "reduced"}
        (home / "state.json").write_text(json.dumps({"settings": settings, "sessions": []}), encoding="utf-8")
        env = dict(os.environ, AGENT_ISLAND_HOME=str(home))
        subprocess.run([installer, "/S", "/currentuser", f"/D={install}"], check=True, timeout=150, env=env)
        executable, = list(install.rglob("Agent Island.exe"))
        print(f"PASS  Verified SHA-256 and installed {tag}", flush=True)
        check_window(executable, env)


if __name__ == "__main__":
    main()
