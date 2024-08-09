import { Context } from 'koishi'

module.exports=(ctx:Context)=>{
  
  function apply(){
    ctx.plugin('schedule',{
      tasks:[
        {
          name:'sch',
          cron:'0 */30 * * *',
          async execute(){
            await ctx.app.broadcast(['2803355799'],'活着')
          }
        }
      ]
    })
  }
}
