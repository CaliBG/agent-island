"""Exercise the public x64 installer against a real Win32 window underneath the island."""
import ctypes
from ctypes import wintypes as wt
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import socket
import sys
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


def check_window(executable, env, minimized=True, opacity=None, expanded_opacity=None):
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
    get_client_rect = dll_function(user, "GetClientRect", [hwnd, ctypes.POINTER(wt.RECT)], wt.BOOL)
    get_title = dll_function(user, "GetWindowTextW", [hwnd, wt.LPWSTR, cint], cint)
    get_class = dll_function(user, "GetClassNameW", [hwnd, wt.LPWSTR, cint], cint)
    get_foreground = dll_function(user, "GetForegroundWindow", [], hwnd)
    get_cursor = dll_function(user, "GetCursorPos", [ctypes.POINTER(wt.POINT)], wt.BOOL)
    from_point = dll_function(user, "WindowFromPoint", [wt.POINT], hwnd)
    dpi = dll_function(user, "GetDpiForWindow", [hwnd], uint)
    move = dll_function(user, "SetCursorPos", [cint, cint], wt.BOOL)
    click = dll_function(user, "mouse_event", [wt.DWORD] * 4 + [ctypes.c_size_t], None)
    key = dll_function(user, "keybd_event", [wt.BYTE, wt.BYTE, wt.DWORD, ctypes.c_size_t], None)
    dll_function(user, "SetThreadDpiAwarenessContext", [handle], handle)(ctypes.c_void_p(-4))
    get_dc = dll_function(user, "GetDC", [hwnd], handle)
    release_dc = dll_function(user, "ReleaseDC", [hwnd, handle], cint)
    compatible_dc = dll_function(gdi, "CreateCompatibleDC", [handle], handle)
    bitmap = dll_function(gdi, "CreateCompatibleBitmap", [handle,cint,cint], handle)
    select = dll_function(gdi, "SelectObject", [handle,handle], handle)
    blit = dll_function(gdi, "BitBlt", [handle,cint,cint,cint,cint,handle,cint,cint,wt.DWORD], wt.BOOL)
    pixel = dll_function(gdi, "GetPixel", [handle,cint,cint], wt.DWORD)
    delete_dc = dll_function(gdi, "DeleteDC", [handle], wt.BOOL)

    def screen_colors(x, y, width=1, height=1):
        desktop = get_dc(None)
        memory = compatible_dc(desktop)
        image = bitmap(desktop, width, height)
        original = select(memory, image)
        try:
            # CAPTUREBLT includes the Electron layered window in the reading-window sample.
            assert blit(memory, 0, 0, width, height, desktop, x, y, 0x40CC0020)
            colors = [pixel(memory, col, row) for row in range(height) for col in range(width)]
            assert 0xFFFFFFFF not in colors
            return [tuple((color >> shift) & 255 for shift in (0, 8, 16)) for color in colors]
        finally:
            select(memory, original)
            delete(image)
            delete_dc(memory)
            release_dc(None, desktop)

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
    island = None
    compact_width, compact_height = (120,16) if opacity is not None else (64,6)

    def rect_values(r):
        return (r.left, r.top, r.right, r.bottom) if r is not None else None

    def identify(win):
        if not win:
            return None
        title, classname = ctypes.create_unicode_buffer(128), ctypes.create_unicode_buffer(128)
        get_title(win, title, len(title))
        get_class(win, classname, len(classname))
        return {"hwnd": hex(win), "pid": pid_of(win), "class": classname.value, "title": title.value}

    def observation():
        cursor = wt.POINT()
        has_cursor = get_cursor(byref(cursor))
        bounds = wt.RECT()
        return {
            "appPid": process.pid, "island": identify(island), "dpi": dpi(island) if island else None,
            "bounds": rect_values(bounds) if island and get_rect(island, byref(bounds)) else None,
            "region": rect_values(region(island)) if island else None,
            "cursor": (cursor.x, cursor.y) if has_cursor else None,
            "hit": identify(from_point(cursor)) if has_cursor else None,
            "foreground": identify(get_foreground()),
        }

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
        raise TimeoutError(f"{description}. Win32 observation: {json.dumps(observation(), ensure_ascii=True)}")

    def find_island():
        result = []
        @enum_proc
        def visit(win, _):
            if visible(win) and pid_of(win) == process.pid:
                r = region(win)
                scale = dpi(win) / 96
                bounds = wt.RECT()
                classic = not minimized and get_client_rect(win, byref(bounds)) and abs(bounds.right - 468*scale) <= 2
                if classic or (minimized and r and scale > 0 and abs(r.right - r.left - compact_width * scale) <= 1 and abs(r.bottom - r.top - compact_height * scale) <= 1):
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

    def verify_paint(samples, compact=True):
        # Change only the window behind AISLAND. The difference between two
        # framebuffer samples gives the actual compositor alpha, independent of
        # the overlay's foreground color and content.
        light, dark = 222, 32
        until = time.monotonic() + 12
        observations = {}
        while time.monotonic() < until:
            readings = []
            for shade in (light, dark):
                article.configure(background=("#%02x%02x%02x" % (shade,shade,shade)))
                article.update()
                time.sleep(.13)
                readings.append([screen_colors(x,y)[0] for x,y,_ in samples])
            good = True
            for (x,y,expected), one, two in zip(samples, *readings):
                alpha = [1-(a-b)/(light-dark) for a,b in zip(one,two)]
                observations[(x,y)] = (one,two,[round(v,3) for v in alpha],expected)
                good &= all(abs(v-expected)<.055 for v in alpha)
            if good:
                # A black full-size compact pill and a blue compact strip are
                # mutually exclusive at this same centre pixel.
                r,g,b = readings[1][0]
                if compact:
                    assert (b-r>120*opacity/100 if minimized else max(r,g,b)-min(r,g,b)<17), observations
                percent = opacity if compact else expanded_opacity
                print(f"PASS  Window compositor, {'strip' if minimized else 'classic island'}, {'compact' if compact else 'expanded'}, {percent}%: {observations}", flush=True)
                return
        raise AssertionError(f"Unexpected actual screen alpha: {observations}")

    try:
        island = wait(find_island, "visible native island window", timeout=40)
        scale = dpi(island) / 96
        assert scale > 0, "Unable to read window DPI"
        window = wt.RECT()
        assert get_rect(island, byref(window))
        centre = (window.left + window.right) // 2
        def point(dx,dy):
            return (centre+round(dx*scale), window.top+round(dy*scale))

        if opacity is not None:
            if minimized:
                verify_paint([(*point(-25,8), opacity/100), (*point(42,8), opacity/100),
                              (*point(-25,2),0), (*point(-25,14),0), (*point(20,8),0)])
                # On the dark reading surface, the right badge has a neutral
                # light wordmark as well as its darker rounded plate.
                palette = screen_colors(*point(24,2),round(32*scale),round(12*scale))
                light = sum(min(rgb)>32+100*opacity/100 for rgb in palette)
                dark = sum(max(rgb)<56 for rgb in palette)
                assert light >= 5 and dark >= 5, f"Missing compact wordmark pixels: {light=} {dark=}"
            else:
                verify_paint([(*point(0,3),opacity/100),(*point(50,12),opacity/100)])
        if not minimized:
            inside = (centre+round(55*scale), window.top+round(12*scale))
            outside = (centre+round(145*scale), window.top+round(12*scale))
            assert move(*outside)
            wait(lambda: pid_of(from_point(wt.POINT(*outside))) == os.getpid(), "reading window beside classic pill")
            before = len(clicks)
            tap()
            wait(lambda: len(clicks) > before, "reading window click beside classic pill")
            assert move(*inside)
            wait(lambda: pid_of(from_point(wt.POINT(*inside))) == process.pid, "classic pill to take cursor")
            before = len(clicks)
            tap()
            # A click, with ordinary hover turned off, opens a panel that now
            # accepts input below the previous 36-DIP compact footprint.
            below = (centre, window.top+round(60*scale))
            assert move(*below)
            wait(lambda: pid_of(from_point(wt.POINT(*below))) == process.pid, "click expanded the classic island")
            assert len(clicks) == before
            verify_paint([(centre, window.top+round(45*scale), expanded_opacity/100)], compact=False)
            print("PASS  Classic island opened by click; the adjacent reading window remains interactive", flush=True)
            return

        def shape(compact):
            r = region(island)
            if not r:
                return False
            w, h = r.right - r.left, r.bottom - r.top
            if compact:
                return r if abs(w - compact_width * scale) <= 1 and abs(h - compact_height * scale) <= 1 else None
            client = wt.RECT()
            if not get_client_rect(island, byref(client)):
                return None
            # The expanded surface fills the client area except its side insets.
            full_width = client.right - client.left
            return r if 0 < full_width and full_width - 24 * scale <= w <= full_width + 1 and h > 60 * scale else None

        r = wait(lambda: shape(True), "collapsed native region")
        x = window.left + (r.left + r.right) // 2
        y = window.top + (r.top + r.bottom) // 2
        assert window.top + r.top == 0, "Strip must touch the primary screen top"
        assert abs(x - article.winfo_screenwidth() / 2) <= 1, "Strip must be centred"
        assert pid_of(from_point(wt.POINT(x, y))) == process.pid, "Strip hit should belong to AISLAND"
        under_y = window.top + r.bottom + 1
        outer_x = window.left + r.right + 2
        outside_points = [(x, under_y), (outer_x, y)]
        if opacity is not None:
            outside_points.extend([point(-25,2),point(-25,14),point(20,8)])
        for outside in outside_points:
            assert pid_of(from_point(wt.POINT(*outside))) == os.getpid(), f"Reading window should own {outside}"
            assert move(*outside)
            before = len(clicks)
            tap()
            wait(lambda: len(clicks) > before, "reading window to receive the click")
        print("PASS  Top-centred native capsule and click-through below and beside it", flush=True)

        # Enter exactly once as soon as the native strip exists. It must open
        # even if the page has not attached its mouse listeners yet.
        assert move(x, y)
        wait(lambda: shape(False), "cold-start hover before any keyboard interaction")
        assert move(32, 100)
        wait(lambda: shape(True), "collapse after cold-start hover")
        print("PASS  First entry after startup, including a stationary pointer", flush=True)

        shortcut()
        opened = wait(lambda: shape(False), "renderer expansion via the global shortcut", timeout=35)
        if opacity is not None:
            assert opened.top == r.top, "Expanded floating panel must remain on its original anchor"
            left, right = window.left + opened.left, window.left + opened.right
            top, bottom = window.top + opened.top, window.top + opened.bottom
            verify_paint([(centre, top+round(12*scale), expanded_opacity/100),
                          (left+1, top+1, 0), (right-2, top+1, 0),
                          (left+1, bottom-2, 0), (right-2, bottom-2, 0)], compact=False)
        shortcut()
        wait(lambda: shape(True), "renderer collapse via the global shortcut")
        print(f"PASS  Global shortcut opened {opened.right-opened.left} x {opened.bottom-opened.top} px and collapsed", flush=True)
        assert pid_of(from_point(wt.POINT(32, 100))) == os.getpid(), "Pointer should start above the reading window"
        if opacity is not None:
            x,y=point(42,8)  # Both the blue rail and the logo must expand.
        assert move(x, y)
        wait(lambda: shape(False), "native hover expansion with ordinary hover disabled")
        before = len(clicks)
        assert pid_of(from_point(wt.POINT(x, y))) == process.pid
        tap()
        assert move(32, 100)
        wait(lambda: shape(True), "native collapse after cursor leaves")
        assert len(clicks) == before, "Click on the island leaked into the reading window"
        print("PASS  Hover, expansion, pointer ownership and collapse", flush=True)

    finally:
        try:
            if process.poll() is None:
                subprocess.run(["taskkill", "/PID", str(process.pid), "/T", "/F"], check=False, capture_output=True)
                process.wait(timeout=10)
        finally:
            article.destroy()


def check_observers(executable, profile, env):
    """Exercise the installed adapters against an isolated running desktop bridge."""
    env = dict(env, COPILOT_HOME=str(profile / "copilot"), OPENCODE_CONFIG_DIR=str(profile / "opencode"))
    installer = executable.parent / "resources" / "integrations" / "desktop-agents" / "install.py"
    for name in ("opencode", "copilot"):
        subprocess.run([sys.executable, installer, name], env=env, check=True, timeout=15)
    process = subprocess.Popen([executable, "--background"], env=env)
    try:
        deadline = time.monotonic() + 40
        while not (profile / "connection.json").exists():
            if process.poll() is not None or time.monotonic() >= deadline:
                raise RuntimeError("Desktop bridge failed to start")
            time.sleep(0.1)
        hooks = json.loads((profile / "copilot/hooks/aisland-observer.json").read_text(encoding="utf-8"))["hooks"]
        hook = hooks["userPromptSubmitted"][0]
        subprocess.run([hook["exec"], *hook["args"]], input=json.dumps({"sessionId":"windows-check", "cwd":str(profile)}),
                       text=True, env={**env, **hook["env"]}, check=True, timeout=10)
        plugin = profile / "opencode/plugins/aisland-observer.js"
        (plugin.parent / "package.json").write_text('{"type":"module"}', encoding="utf-8")
        probe = """
            import {pathToFileURL} from 'node:url';
            const {default: plugin} = await import(pathToFileURL(process.argv[1]));
            const observer = await plugin.server({directory:process.cwd()});
            await observer.event({event:{type:'session.status',properties:{sessionID:'windows-check',status:{type:'busy'}}}});
        """
        subprocess.run(["node", "--input-type=module", "-e", probe, str(plugin)], cwd=profile, check=True, timeout=15)
        for name in ("opencode", "copilot"):
            receipt = json.loads((profile / "integrations" / f"{name}-last-event.json").read_text(encoding="utf-8"))
            assert receipt["sessionId"] == name + ":windows-check", receipt
        print("PASS  Both packaged observers delivered scoped task events to the installed Windows bridge", flush=True)
    finally:
        if process.poll() is None:
            subprocess.run(["taskkill", "/PID", str(process.pid), "/T", "/F"], capture_output=True)
            process.wait(timeout=10)


def check_session_management(executable, profile, settings):
    profile.mkdir()
    (profile / "state.json").write_text(json.dumps({"settings":settings,"sessions":[]}), encoding="utf-8")
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        port = listener.getsockname()[1]
    process = subprocess.Popen([executable, "--dashboard", "--remote-debugging-address=127.0.0.1",
                                f"--remote-debugging-port={port}"], env=dict(os.environ, AGENT_ISLAND_HOME=str(profile)))
    try:
        script = Path(__file__).with_name("windows-session-management.mjs")
        subprocess.run(["node", "--experimental-websocket", script, profile, str(port), str(process.pid)], check=True, timeout=70)
    finally:
        if process.poll() is None:
            subprocess.run(["taskkill", "/PID", str(process.pid), "/T", "/F"], capture_output=True)
            process.wait(timeout=10)


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
        version = tuple(map(int,tag[1:].split(".")))
        if version >= (0,3,57):
            check_session_management(executable, temp / "session-management", settings)
        if version >= (0,3,56):
            check_observers(executable, home, env)
        if version < (0,3,53):
            check_window(executable, env)
            return
        for minimized, opacity in ((True,30), (False,30), (True,100), (False,100)):
            profile = temp / f"profile-{minimized}-{opacity}"
            profile.mkdir()
            prefs = dict(settings, windowsMinimized=minimized, position="edge", opacity=opacity, compactWidth=260)
            expanded_opacity = opacity
            if version >= (0,3,54):
                expanded_opacity = 100 if opacity == 30 else 30
                prefs["expandedOpacity"] = expanded_opacity
            (profile / "state.json").write_text(json.dumps({"settings":prefs,"sessions":[]}), encoding="utf-8")
            check_window(executable, dict(env, AGENT_ISLAND_HOME=str(profile)), minimized, opacity, expanded_opacity)


if __name__ == "__main__":
    main()
