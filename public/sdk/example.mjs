import { AgentIsland } from './agent-island.mjs';
const island=new AgentIsland({agent:'My Agent',title:'本地接入测试',target:{type:'folder',value:process.cwd()}});
try {
  await island.start('这是真实本地连接的示例，不会执行 shell 命令。');
  await island.tool('Read','查看工作目录');
  const approval=await island.approve({title:'确认示例操作',command:'echo "Hello from Agent Island"',content:'仅演示审批往返；此示例不会运行这条命令。'});
  console.log('Approval:',approval);
  if(approval.decision!=='allow'){await island.complete('示例操作未获批准。');process.exit(0);}
  const answer=await island.ask([{id:'target',prompt:'将示例应用部署到哪里？',options:['本地预览','测试环境'],multiple:false}]);
  console.log('Answers:',answer);
  await island.usage(12400,128000,'上下文');
  await island.complete('审批与问答已成功往返，通用接口接入完成。');
}catch(error){console.error('请先启动 Agent Island。',error.message);process.exitCode=1;}
