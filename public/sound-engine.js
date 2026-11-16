/** Small local synthesizer shared by the desktop app and website demo. */
export const SOUND_EVENTS = {
  start: {label:'任务开始',notes:[[523.25,0,.065],[783.99,.075,.09]]},
  attention: {label:'等待回应',notes:[[880,0,.075],[1174.66,.115,.12]]},
  complete: {label:'任务完成',notes:[[523.25,0,.085],[659.25,.09,.085],[783.99,.18,.085],[1046.5,.27,.14]]},
  error: {label:'任务出错',notes:[[293.66,0,.12],[220,.15,.18]]},
  allow: {label:'允许操作',notes:[[659.25,0,.055],[987.77,.065,.1]]},
  deny: {label:'拒绝操作',notes:[[329.63,0,.065],[246.94,.075,.11]]},
  open: {label:'展开面板',notes:[[659.25,0,.035],[783.99,.04,.045]]},
  close: {label:'收起面板',notes:[[523.25,0,.035],[392,.04,.045]]}
};
export class IslandSound {
  constructor(context) {this.context=context||null;this.voices=new Set();this.last=new Map();}
  async play(name,{volume=35,theme='pixel',preview=false}={}) {
    const definition=SOUND_EVENTS[name];
    if(!definition||!Number.isFinite(volume)||volume<=0)return false;
    const now=performance.now();
    if(!preview&&now-(this.last.get(name)||-Infinity)<180)return false;
    this.last.set(name,now);
    if(!this.context)this.context=new AudioContext({latencyHint:'interactive'});
    const ctx=this.context;
    if(typeof AudioContext!=='undefined'&&ctx instanceof AudioContext&&ctx.state==='suspended')await ctx.resume();
    if(ctx.state==='closed')return false;
    this.stop();
    const start=ctx.currentTime+.008;
    const level=Math.min(100,volume)/100*(theme==='soft'?.12:.065);
    for(const [frequency,offset,length] of definition.notes) {
      const oscillator=ctx.createOscillator();const gain=ctx.createGain();
      oscillator.type=theme==='soft'?'sine':name==='error'?'triangle':'square';
      oscillator.frequency.setValueAtTime(frequency,start+offset);
      gain.gain.setValueAtTime(0,start+offset);
      gain.gain.linearRampToValueAtTime(level,start+offset+.004);
      gain.gain.exponentialRampToValueAtTime(.0001,start+offset+length);
      oscillator.connect(gain);gain.connect(ctx.destination);
      this.voices.add(oscillator);
      oscillator.onended=()=>{this.voices.delete(oscillator);oscillator.disconnect();gain.disconnect();};
      oscillator.start(start+offset);oscillator.stop(start+offset+length+.008);
    }
    return true;
  }
  stop(){for(const oscillator of this.voices){try{oscillator.stop();}catch{}}this.voices.clear();}
  async close(){this.stop();if(this.context&&'close' in this.context)await this.context.close();}
}
