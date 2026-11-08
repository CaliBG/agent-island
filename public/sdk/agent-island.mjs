import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
/** Local SDK, Node.js 20+. No dependencies or remote services. */
export class AgentIsland {
  constructor({sessionId=randomUUID(),agent='Custom Agent',title='New task',cwd=process.cwd(),target,home=process.env.AGENT_ISLAND_HOME||join(homedir(),'.agent-island'),connection}={}) {
    Object.assign(this,{sessionId,agent,title,cwd,target,home,connection});
  }
  async send(event,detail={}) {
    const conn=this.connection||JSON.parse(await readFile(join(this.home,'connection.json'),'utf8'));
    const url=new URL(conn.endpoint);if(url.protocol!=='http:'||url.hostname!=='127.0.0.1')throw new Error('Bridge endpoint must be local');
    const response=await fetch(`${url.origin}/v1/events`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${conn.token}`},body:JSON.stringify({sessionId:this.sessionId,agent:this.agent,title:this.title,cwd:this.cwd,target:this.target,eventId:randomUUID(),...detail,event}),signal:AbortSignal.timeout(event.endsWith('.request')?615000:5000)});
    const data=await response.json();if(!response.ok)throw new Error(data.error||`Bridge returned ${response.status}`);return data;
  }
  start(content='开始处理任务'){return this.send('task.start',{content});}
  tool(tool,content=''){return this.send('tool.start',{tool,content});}
  message(content){return this.send('message',{content});}
  approve({title='操作需要确认',command='',diff='',content='',requestId=randomUUID()}={}){return this.send('approval.request',{requestId,requestTitle:title,command,diff,content});}
  ask(questions,{title='需要你的回答',requestId=randomUUID()}={}){return this.send('question.request',{requestId,requestTitle:title,questions});}
  plan(content,{title='请审阅执行计划',requestId=randomUUID()}={}){return this.send('plan.request',{requestId,requestTitle:title,content});}
  usage(used,limit,label='用量',resetAt=''){return this.send('usage',{used,limit,label,resetAt});}
  complete(content='任务已完成'){return this.send('task.complete',{content});}
  fail(content){return this.send('task.error',{content});}
}
