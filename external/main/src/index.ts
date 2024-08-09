import { Context, h, Schema, segment } from 'koishi'
import fs from "node:fs"

export const name = 'main'

export interface Config { }

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {

    function getRandomInt(min: number, max: number): number {
        const minCeiled = Math.ceil(min);
        const maxFloored = Math.floor(max);
        return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
    }
    function addPrefixJudge(session, str: string) {
        if (session == str ||
            session == '.' + str ||
            session == '/' + str ||
            session == '。' + str
        ) return true;
        else return false;
    }
    ctx.on('message', (session) => {
        console.log(session.channelId + ' ' + session.userId + ':' + session.content)
        if (addPrefixJudge(session, 'jwz') || addPrefixJudge(session, '金炜智')) {
            let fileList = fs.readdirSync('C:/Users/Server/Desktop/Bot/external/main/jwz_pictures');
            let randIndex = getRandomInt(0, fileList.length - 1);
            session.send(segment('image', {
                url: 'C:/Users/Server/Desktop/Bot/external/main/jwz_pictures/' + fileList[randIndex]
            }))
        }
        else if (addPrefixJudge(session.content, 'zyj') ||
            addPrefixJudge(session.content, '张宇杰') ||
            addPrefixJudge(session.content, '章鱼杰')) {
            let fileList = fs.readdirSync('C:/Users/Server/Desktop/Bot/external/main/zyj_pictures');
            let randIndex = getRandomInt(0, fileList.length - 1);
            session.send(segment('image', {
                url: 'C:/Users/Server/Desktop/Bot/external/main/zyj_pictures/' + fileList[randIndex]
            }))
        }
        else if (addPrefixJudge(session.content, 'zjh') ||
            addPrefixJudge(session.content, '张家涵') ||
            addPrefixJudge(session.content, 'libersky') ||
            addPrefixJudge(session.content, 'Libersky')) {
            let fileList = fs.readdirSync('C:/Users/Server/Desktop/Bot/external/main/zjh_pictures');
            let randIndex = getRandomInt(0, fileList.length - 1);
            session.send(segment('image', {
                url: 'C:/Users/Server/Desktop/Bot/external/main/zjh_pictures/' + fileList[randIndex]
            }))
        }
        else if (addPrefixJudge(session.content, 'gyc') ||
            addPrefixJudge(session.content, 'Chisato') ||
            addPrefixJudge(session.content, 'chisato')) {
            let fileList = fs.readdirSync('C:/Users/Server/Desktop/Bot/external/main/gyc_pictures');
            let randIndex = getRandomInt(0, fileList.length - 1);
            session.send(segment('image', {
                url: 'C:/Users/Server/Desktop/Bot/external/main/gyc_pictures/' + fileList[randIndex]
            }))
        }
        else if (addPrefixJudge(session.content, 'sly') ||
            addPrefixJudge(session.content, '沈凌亦') ||
            addPrefixJudge(session.content, '301')) {
            let fileList = fs.readdirSync('C:/Users/Server/Desktop/Bot/external/main/sly_pictures');
            let randIndex = getRandomInt(0, fileList.length - 1);
            session.send(segment('image', {
                url: 'C:/Users/Server/Desktop/Bot/external/main/sly_pictures/' + fileList[randIndex]
            }))
        }
        else if (addPrefixJudge(session.content, '鱼丸')) {
            let fileList = fs.readdirSync('C:/Users/Server/Desktop/Bot/external/main/yw_pictures');
            let randIndex = getRandomInt(0, fileList.length - 1);
            session.send(segment('image', {
                url: 'C:/Users/Server/Desktop/Bot/external/main/yw_pictures/' + fileList[randIndex]
            }))
        }
        else if (addPrefixJudge(session.content, '美丽sly') ||
            addPrefixJudge(session.content, '美丽301') ||
            addPrefixJudge(session.content, '美丽沈凌亦')) {
            session.send(h('video', {
                src: 'C:/Users/Server/Desktop/Bot/external/main/sly_videos/1954868fafebe3364eab337762e50a8a.mp4'
            }))
        }
        else if (addPrefixJudge(session.content.substring(0, 3), 'maa')) {
            if (session.userId == "2803355799") {
                let opt = session.content.substring(4, session.content.length);
                if (opt != "sc") fetch("http://192.168.0.106:3000/" + opt, {
                    method: "POST"
                })
                session.send("已发送请求.")
                setTimeout(() => {
                    fetch("http://192.168.0.106:3000/sc", {
                        method: "POST"
                    })
                }, 6000);
                setTimeout(() => {
                    session.send(segment('image', {
                        url: 'C:/Users/Server/Desktop/Bot/external/main/screenshot/screenshot.png'
                    }))
                }, 9000);
            }
            else session.send("无权限.")
        }
        else if (addPrefixJudge(session.content.substring(0, 4), 'maa')) {
            if (session.userId == "2803355799") {
                let opt = session.content.substring(5, session.content.length);
                if (opt != "sc") fetch("http://192.168.0.106:3000/" + opt, {
                    method: "POST"
                })
                session.send("已发送请求.")
                setTimeout(() => {
                    fetch("http://192.168.0.106:3000/sc", {
                        method: "POST"
                    })
                }, 6000);
                setTimeout(() => {
                    session.send(segment('image', {
                        url: 'C:/Users/Server/Desktop/Bot/external/main/screenshot/screenshot.png'
                    }))
                }, 9000);
            }
            else session.send("无权限.")
        }
    })
    ctx.command('checkAlive').action((_) => {
        let date = new Date()
        return 'Bot还活着.\n' + date.toLocaleString();
    })
}