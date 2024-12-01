import { Context, h, Schema, segment } from 'koishi'
import fs from "node:fs"
import { PrismaClient } from '@prisma/client'

export const name = 'main'

export interface Config { }

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
    function NewUser(session) {
        const prisma = new PrismaClient();
        async function main() {
            await prisma.userInfo.create({
                data: {
                    userId: session.userId,
                    name: session.username,
                    auth: 1,
                    discount: 1,
                    money: 0,
                    spent: 0,
                    pc: 0,
                    billing: false
                }
            })
        }
        main().then(() => {
            prisma.$disconnect();
        }).then(() => {
            session.send("已成功注册.")
        })
    }
    function durationString(duration) {
        duration /= 1000;
        let day = Math.floor(duration / (60 * 60 * 24)); duration %= (60 * 60 * 24);
        let hour = Math.floor(duration / (60 * 60)); duration %= (60 * 60);
        let minute = Math.floor(duration / 60); duration %= 60
        let second = Math.floor(duration);
        return day.toString() + "天" + hour.toString() + "小时" + minute.toString() + "分钟" + second.toString() + "秒";
    }
    function getAuthType(auth) {
        if (auth == "0") return "STAFF";
        if (auth == "1") return "玩家";
        if (auth == "2") return "BAN_STATE_1";
        if (auth == "3") return "BAN_STATE_2";
        return "未知";
    }
    function getDiscount(dis) {
        if (dis == 1) return "无";
        if (dis == 0) return "免费游玩";
        return (dis * 10).toString() + "折";
    }
    function Revise(content, session) {
        let p1 = -1, p2 = -1;
        for (let i = 0; i < content.length; i++) {
            if (content[i] == '.') {
                p1 = i;
                break;
            }
        }
        if (p1 == -1) {
            session.send("非法修改.");
            return;
        }
        for (let i = p1 + 1; i < content.length; i++) {
            if (content[i] == '=') {
                p2 = i;
                break;
            }
        }
        if (p2 == -1) {
            session.send("非法修改.");
            return;
        }
        let part1 = content.slice(0, p1);
        let part2 = content.slice(p1 + 1, p2);
        let part3 = content.slice(p2 + 1, content.length);
        const prisma = new PrismaClient();
        async function main() {
            let user = await prisma.userInfo.findMany({
                where: {
                    OR: [
                        { name: { contains: part1 } },
                        { userId: { equals: part1 } }
                    ]
                }
            })
            if (user.length == 0) {
                session.send("未知用户.");
                return;
            }
            if (user.length > 1) {
                session.send("查找到多个用户，请缩小范围.");
                return;
            }
            let user1 = user[0];
            if (user1[part2] == undefined) {
                session.send("不存在该属性.");
                return;
            }
            await prisma.userInfo.update({
                where: {
                    id: user[0].id
                },
                data: {
                    [part2]: (part2 == "discount" || part2 == "money" || part2 == "spent") ? parseFloat(part3) : (typeof user1[part2] === 'number' ? parseInt(part3) : (part3 == 'true' ? true : (part3 == 'false' ? false : part3)))
                }
            })
            session.send("已将 " + part1 + " 的 " + part2 + " 修改为 " + part3);
        }
        main().then(() => {
            prisma.$disconnect();
        })
    }
    function Recharge(content, session) {
        let p1 = -1, type = 0, platform = "";
        if (content[0] == 'z') platform = "zfb";
        else if (content[0] == 'w') platform == 'wx';
        else {
            session.send("未添加平台信息.");
            return;
        }
        for (let i = 1; i < content.length; i++) {
            if (content[i] == '+') {
                p1 = i;
                type = 1;
                break;
            }
            else if (content[i] == '-') {
                p1 = i;
                type = -1;
                break;
            }
        }
        if (p1 == -1) {
            session.send("非法修改.");
            return;
        }
        let part1 = content.slice(1, p1);
        let part2 = content.slice(p1 + 1, content.length);
        const prisma = new PrismaClient();
        async function main() {
            let user = await prisma.userInfo.findMany({
                where: {
                    OR: [
                        { name: { contains: part1 } },
                        { userId: { equals: part1 } }
                    ]
                }
            })
            if (user.length == 0) {
                session.send("未知用户.");
                return;
            }
            if (user.length > 1) {
                session.send("查找到多个用户，请缩小范围.");
                return;
            }
            let user1 = user[0];
            if (isNaN(parseInt(part2))) {
                session.send("非法数字.");
                return;
            }
            await prisma.userInfo.update({
                where: {
                    id: user[0].id
                },
                data: {
                    money: user[0].money + type * parseInt(part2)
                }
            }).then(async () => {
                session.send("已将 " + part1 + "  的余额" + (type == 1 ? "增加 " : "减少 ") + part2 + "￥\n");
                await prisma.rechargeLog.create({
                    data: {
                        userId: session.userId,
                        amount: type * parseInt(part2),
                        platform,
                        timeStamp: new Date().getTime()
                    }
                })
            })
        }
        main().then(() => {
            prisma.$disconnect();
        })
    }
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
    async function authCheck(userId, session, level) {
        let prisma = new PrismaClient();
        try {
            const checkWhite = await (async () => {
                const w = await prisma.whitelist.findMany({ where: { userId } });
                return w.length > 0;
            })();

            if (!checkWhite) {
                session.send("您未被加入白名单，禁止使用.");
                return false;
            }

            const checkLevel = await (async () => {
                const l = await prisma.userInfo.findMany({
                    where: {
                        AND: [{ auth: { lte: level } }, { userId }],
                    },
                });
                return l.length > 0;
            })();

            if (!checkLevel) {
                session.send("权限不足.");
                return false;
            }

            return true;
        } finally {
            await prisma.$disconnect();
        }
    }
    ctx.on('message', async (session) => {
        console.log(session.channelId + ' ' + session.userId + ':' + session.content)
        if (addPrefixJudge(session.content, 'jwz') || addPrefixJudge(session.content, '金炜智')) {
            let fileList = fs.readdirSync('C:/Users/Server/Desktop/Bot/external/main/jwz_pictures');
            let randIndex = getRandomInt(0, fileList.length);
            session.send(segment('image', {
                url: 'C:/Users/Server/Desktop/Bot/external/main/jwz_pictures/' + fileList[randIndex]
            }))
        }
        else if (addPrefixJudge(session.content, 'zyj') ||
            addPrefixJudge(session.content, '张宇杰') ||
            addPrefixJudge(session.content, '章鱼杰')) {
            let fileList = fs.readdirSync('C:/Users/Server/Desktop/Bot/external/main/zyj_pictures');
            let randIndex = getRandomInt(0, fileList.length);
            session.send(segment('image', {
                url: 'C:/Users/Server/Desktop/Bot/external/main/zyj_pictures/' + fileList[randIndex]
            }))
        }
        else if (addPrefixJudge(session.content, 'zjh') ||
            addPrefixJudge(session.content, '张家涵') ||
            addPrefixJudge(session.content, 'libersky') ||
            addPrefixJudge(session.content, 'Libersky')) {
            let fileList = fs.readdirSync('C:/Users/Server/Desktop/Bot/external/main/zjh_pictures');
            let randIndex = getRandomInt(0, fileList.length);
            session.send(segment('image', {
                url: 'C:/Users/Server/Desktop/Bot/external/main/zjh_pictures/' + fileList[randIndex]
            }))
        }
        else if (addPrefixJudge(session.content, 'gyc') ||
            addPrefixJudge(session.content, 'Chisato') ||
            addPrefixJudge(session.content, 'chisato')) {
            let fileList = fs.readdirSync('C:/Users/Server/Desktop/Bot/external/main/gyc_pictures');
            let randIndex = getRandomInt(0, fileList.length);
            session.send(segment('image', {
                url: 'C:/Users/Server/Desktop/Bot/external/main/gyc_pictures/' + fileList[randIndex]
            }))
        }
        else if (addPrefixJudge(session.content, 'sly') ||
            addPrefixJudge(session.content, '沈凌亦') ||
            addPrefixJudge(session.content, '301')) {
            let fileList = fs.readdirSync('C:/Users/Server/Desktop/Bot/external/main/sly_pictures');
            let randIndex = getRandomInt(0, fileList.length);
            session.send(segment('image', {
                url: 'C:/Users/Server/Desktop/Bot/external/main/sly_pictures/' + fileList[randIndex]
            }))
        }
        else if (addPrefixJudge(session.content, '鱼丸')) {
            let fileList = fs.readdirSync('C:/Users/Server/Desktop/Bot/external/main/yw_pictures');
            let randIndex = getRandomInt(0, fileList.length);
            session.send(segment('image', {
                url: 'C:/Users/Server/Desktop/Bot/external/main/yw_pictures/' + fileList[randIndex]
            }))
        }
        else if (addPrefixJudge(session.content, '美丽sly') ||
            addPrefixJudge(session.content, '美丽301') ||
            addPrefixJudge(session.content, '美丽沈凌亦')) {
            let fileList = fs.readdirSync('C:/Users/Server/Desktop/Bot/external/main/sly_videos');
            let randIndex = getRandomInt(0, fileList.length);
            console.log(fileList[randIndex]);
            session.send(h('video', {
                src: 'C:/Users/Server/Desktop/Bot/external/main/sly_videos/' + fileList[randIndex]
            }))
        }
        // else if (addPrefixJudge(session.content.substring(0, 3), 'maa') || addPrefixJudge(session.content.substring(0, 4), 'maa')) {
        //     if (authCheck(session.userId)) {
        //         let a = 0;
        //         let cmdList = ["on", "off", "sc"]
        //         if (addPrefixJudge(session.content.substring(0, 3), 'maa')) a = 4;
        //         else a = 5;
        //         let opt = session.content.substring(a, session.content.length);
        //         if (checkCmd(opt, cmdList)) {
        //             if (opt != "sc") fetch("http://192.168.0.106:3000/" + opt, {
        //                 method: "POST"
        //             })
        //             session.send("已发送请求.")
        //             setTimeout(() => {
        //                 fetch("http://192.168.0.106:3000/sc", {
        //                     method: "POST"
        //                 })
        //             }, 6000);
        //             setTimeout(() => {
        //                 session.send(segment('image', {
        //                     url: 'C:/Users/Server/Desktop/Bot/external/main/screenshot/screenshot.png'
        //                 }))
        //             }, 9000);
        //         }
        //         else session.send("未知指令.")
        //     }
        //     else session.send("无权限.")
        // }
        if (session.channelId == "953068755" || session.channelId == "private:2803355799") {
            if ((addPrefixJudge(session.content, "money") || (addPrefixJudge(session.content, "余额"))) && await authCheck(session.userId, session, 2)) {
                let prisma = new PrismaClient();
                let userId = session.userId;
                async function main() {
                    let user = await prisma.userInfo.findMany({
                        where: { userId }
                    })
                    if (user.length == 0) {
                        session.send("未注册.");
                        return;
                    }
                    session.send(user[0].name + ' 的账户余额为 ' + user[0].money + ' 元.');
                }
                main().then(async () => {
                    await prisma.$disconnect();
                })
            }
            else if ((addPrefixJudge(session.content, "baltop") || (addPrefixJudge(session.content, "排行"))) && await authCheck(session.userId, session, 1)) {
                const prisma = new PrismaClient();
                async function main() {
                    let data = await prisma.userInfo.findMany({
                        where: {
                            auth: {
                                in: [0, 1, 2]
                            }
                        },
                        orderBy: {
                            spent: 'desc'
                        }
                    })
                    data = data.slice(0, 10);
                    let ans = "XYwow 消费排行榜\n";
                    ans += "共有 " + (await prisma.userInfo.count()).toString() + " 名玩家\n";
                    for (let i = 0; i < data.length; i++) {
                        ans += (i + 1).toString() + ". " + data[i].name.padEnd(10," ") + ' ' + data[i].spent.toString() + '￥\n';
                    }
                    session.send(ans);
                }
                main().then(async () => {
                    await prisma.$disconnect();
                })
            }
            else if ((addPrefixJudge(session.content, "query") || (addPrefixJudge(session.content, "个人信息"))) && await authCheck(session.userId, session, 2)) {
                const prisma = new PrismaClient();
                async function main() {
                    let str = session.userId;
                    let data = await prisma.userInfo.findMany({
                        where: {
                            OR: [
                                { name: { contains: str } },
                                { userId: { equals: str } }
                            ]
                        }
                    })
                    if (data.length == 0) session.send("未找到该玩家.");
                    else {
                        let str = '';
                        for (let i = 0; i < data.length; i++) {
                            str += "QQ号: " + data[i].userId + '\n';
                            str += "用户名: " + data[i].name + '\n';
                            str += "权限: " + getAuthType(data[i].auth) + '\n';
                            str += "折扣: " + getDiscount(data[i].discount) + '\n';
                            str += "余额: " + data[i].money + '￥\n';
                            str += "消费: " + data[i].spent + '￥\n';
                            str += "游玩次数: " + data[i].pc + '\n';
                            str += "是否在店: " + (data[i].billing ? "是" : "否");
                            if (i < data.length - 1) str += '\n\n';
                        }
                        session.send(str);
                    }
                }
                main().then(() => {
                    prisma.$disconnect();
                })
            }
            else if (addPrefixJudge(session.content.slice(0, 6), "query ") && await authCheck(session.userId, session, 0)) {
                const prisma = new PrismaClient();
                async function main() {
                    let str = session.content.slice(6, session.content.length);
                    let data = await prisma.userInfo.findMany({
                        where: {
                            OR: [
                                { name: { contains: str } },
                                { userId: { equals: str } }
                            ]
                        }
                    })
                    if (data.length == 0) session.send("未找到该玩家.");
                    else {
                        let str = '找到 ' + data.length + ' 名玩家.\n\n';
                        for (let i = 0; i < data.length; i++) {
                            str += "QQ号: " + data[i].userId + '\n';
                            str += "用户名: " + data[i].name + '\n';
                            str += "权限: " + getAuthType(data[i].auth) + '\n';
                            str += "折扣: " + getDiscount(data[i].discount) + '\n';
                            str += "余额: " + data[i].money + '￥\n';
                            str += "消费: " + data[i].spent + '￥\n';
                            str += "游玩次数: " + data[i].pc + '\n';
                            str += "是否在店: " + (data[i].billing ? "是" : "否");
                            if (i < data.length - 1) str += '\n\n';
                        }
                        session.send(str);
                    }
                }
                main().then(() => {
                    prisma.$disconnect();
                })
            }
            else if ((addPrefixJudge(session.content.slice(0, 5), "name ")) && await authCheck(session.userId, session, 1)) {
                const prisma = new PrismaClient()
                async function main() {
                    let name = session.content.slice(5, session.content.length);
                    let data = await prisma.userInfo.findMany({
                        where: {
                            userId: session.userId
                        }
                    });
                    if (data.length == 0) {
                        session.send("未注册.");
                        return;
                    }
                    await prisma.userInfo.update({
                        where: { userId: session.userId },
                        data: { name }
                    })
                    session.send("已将用户名改为 " + name);
                }
                main().then(() => {
                    prisma.$disconnect();
                })
            }
            else if (addPrefixJudge(session.content.slice(0, 7), "revise ") && await authCheck(session.userId, session, 0)) {
                Revise(session.content.slice(7, session.content.length), session);
            }
            else if (addPrefixJudge(session.content.slice(0, 3), "rc ") && await authCheck(session.userId, session, 0)) {
                Recharge(session.content.slice(3, session.content.length), session);
            }
            else if (addPrefixJudge(session.content.slice(0, 9), "recharge ") && await authCheck(session.userId, session, 0)) {
                Recharge(session.content.slice(9, session.content.length), session);
            }
            else if (addPrefixJudge(session.content.slice(0, 3), "aw ") && await authCheck(session.userId, session, 0)) {
                let userId = session.content.slice(3, session.content.length);
                const prisma = new PrismaClient();
                async function main() {
                    let wl = await prisma.whitelist.findMany({
                        where: { userId }
                    })
                    if (wl.length == 1) {
                        session.send("添加失败");
                        return;
                    }
                    prisma.whitelist.create({
                        data: {
                            userId
                        }
                    }).then(() => {
                        session.send("添加成功.");
                    }).catch(err => {
                        session.send(err);
                    })
                }
                main().then(() => {
                    prisma.$disconnect();
                })
            }
            else if (addPrefixJudge(session.content.slice(0, 3), "dw ") && await authCheck(session.userId, session, 0)) {
                let userId = session.content.slice(3, session.content.length);
                const prisma = new PrismaClient();
                async function main() {
                    let wl = await prisma.whitelist.findMany({
                        where: { userId }
                    })
                    if (wl.length == 0) {
                        console.log(userId);
                        session.send("删除失败");
                        return;
                    }
                    prisma.whitelist.delete({
                        where: {
                            id: wl[0].id
                        }
                    }).then(() => {
                        session.send("删除成功.");
                    }).catch(err => {
                        session.send(err);
                    })
                }
                main().then(() => {
                    prisma.$disconnect();
                })
            }
            else if (addPrefixJudge(session.content, "reg") || addPrefixJudge(session.content, "register") || (addPrefixJudge(session.content, "注册"))) {
                const prisma = new PrismaClient();
                async function main() {
                    let userId = session.userId;
                    let wl = await prisma.whitelist.findMany({
                        where: { userId }
                    })
                    let ui = await prisma.userInfo.findMany({
                        where: { userId }
                    })
                    if (wl.length == 1) {
                        if (ui.length == 0) NewUser(session);
                        else session.send("已注册，请勿重复注册.");
                    }
                    else session.send("未被添加至白名单，无法注册.")
                    return;
                }
                main().then(() => {
                    prisma.$disconnect();
                })
            }
            else if ((addPrefixJudge(session.content, "enter") || addPrefixJudge(session.content, "进店")) && await authCheck(session.userId, session, 2)) {
                const prisma = new PrismaClient();
                let userId = session.userId;
                async function main() {
                    let user = (await prisma.userInfo.findMany({ where: { userId } }))[0];
                    if (user.billing == false) {
                        if (user.discount != 0 && user.money < 10) {
                            session.send("请保证余额大于10元再进店.")
                            return;
                        }
                        await prisma.playLog.create({
                            data: {
                                userId,
                                enterTime: new Date().getTime(),
                                exitTime: -1,
                                cost: -1
                            }
                        }).then(async () => {
                            await prisma.userInfo.update({ where: { userId }, data: { billing: true } }).then(() => session.send("已成功进店."))
                        })
                        if (user.auth == 0) {
                            await prisma.billingOperator.create({
                                data: { userId }
                            })
                        }
                        else {
                            await prisma.billingPlayer.create({
                                data: { userId }
                            })
                        }
                    }
                    else {
                        session.send("已在店内，无法重复进店.");
                    }
                }
                main().then(() => {
                    prisma.$disconnect();
                })
            }
            else if ((addPrefixJudge(session.content, "exit") || addPrefixJudge(session.content, "离店")) && await authCheck(session.userId, session, 2)) {
                let prisma = new PrismaClient();
                let userId = session.userId;
                async function main() {
                    let pl = await prisma.playLog.findMany({
                        where: { userId }
                    })
                    let user = (await prisma.userInfo.findMany({ where: { userId } }))[0]
                    if (user.billing == false) {
                        session.send("您不在店内.");
                        return;
                    }
                    let exitTime = BigInt(new Date().getTime());
                    let enterTime = pl[pl.length - 1].enterTime;
                    let playTime = Number(exitTime - enterTime);
                    let ds = durationString(playTime);
                    let day = Math.floor(playTime / (1000 * 60 * 60 * 24))
                    let cost = day * 80;
                    playTime -= day * (1000 * 60 * 60 * 24);
                    if (playTime > 1000 * 60 * 60 * 10) {
                        cost += 80;
                    }
                    else {
                        cost += Math.ceil(playTime / (1000 * 60 * 60)) * 8
                    }
                    let discount = (await prisma.userInfo.findMany({ where: { userId } }))[0].discount;
                    console.log(discount);
                    cost *= discount;
                    console.log(cost);
                    await prisma.playLog.update({
                        where: { id: pl[pl.length - 1].id },
                        data: { exitTime, cost }
                    }).then(async () => {
                        await prisma.userInfo.update({
                            where: { userId },
                            data: {
                                money: { decrement: cost },
                                pc: { increment: 1 },
                                spent: { increment: cost },
                                billing: false
                            }
                        })
                    });
                    if (user.auth == 0) {
                        await prisma.billingOperator.deleteMany({
                            where: { userId }
                        })
                    }
                    else {
                        await prisma.billingPlayer.deleteMany({
                            where: { userId }
                        })
                    }
                    let u = await prisma.userInfo.findMany({
                        where: { userId }
                    });
                    let money = u[0].money;
                    session.send("您已离店.\n游玩时长 " + ds + "\n消费 " + cost + " 元\n余额为 " + money + " 元.");
                }
                main().then(() => {
                    prisma.$disconnect();
                })
            }
            else if ((addPrefixJudge(session.content, "j") || addPrefixJudge(session.content, "几")) && authCheck(session.userId, session, 1)) {
                const prisma = new PrismaClient();
                async function main() {
                    let player = await prisma.billingPlayer.findMany();
                    let operator = await prisma.billingOperator.findMany();
                    let str = "店内有 " + operator.length + " 位STAFF与 " + player.length + " 位玩家.";
                    session.send(str);
                }
                main().then(() => {
                    prisma.$disconnect();
                })
            }
            else if ((addPrefixJudge(session.content, "qrcode") || (addPrefixJudge(session.content, "二维码"))) && await authCheck(session.userId, session, 2)) {
                session.send("wx\n" + segment('image', {
                    url: 'C:/Users/Server/Desktop/Bot/external/main/qrcode/w1.png'
                }) + "zfb\n" + segment('image', {
                    url: 'C:/Users/Server/Desktop/Bot/external/main/qrcode/a1.png'
                }))
            }
            else if ((addPrefixJudge(session.content, "gamble") || (addPrefixJudge(session.content, "赌一把"))) && await authCheck(session.userId, session, 2)) {
                session.send("维护中");
                return ;
                const prisma = new PrismaClient();
                async function main() {
                    let users = await prisma.userInfo.findMany({ where: { userId: session.userId } });
                    if (users.length == 0) {
                        session.send("未注册.");
                        return;
                    }
                    let user = users[0];
                    if (user.money <= 10) {
                        session.send("余额不足.");
                        return;
                    }
                    let type = getRandomInt(0, 10);
                    if (type <= 4) type = 1;
                    else type = -1;
                    let delta = getRandomInt(1, 10);
                    await prisma.userInfo.update({
                        where: { userId: session.userId },
                        data: { money: { increment: delta * type } }
                    }).then(async () => {
                        let money = (await prisma.userInfo.findMany({ where: { userId: session.userId } }))[0].money;
                        session.send("你" + (type == 1 ? "赢得" : "失去") + "了" + delta + "元!\n" + "当前余额为 " + money.toString() + " 元.")
                    })
                }
                main().then(() => {
                    prisma.$disconnect();
                })
            }
            else if((addPrefixJudge(session.content,"切换国服")||addPrefixJudge(session.content,"切国服"))&&await authCheck(session.userId,session,0)){
                session.send(await fetch("http://frp-fly.top:48996/cn").then((res)=>{
                    return res.text();
                }))
            }
            else if((addPrefixJudge(session.content,"切换日服")||addPrefixJudge(session.content,"切日服"))&&await authCheck(session.userId,session,1)){
                session.send(await fetch("http://frp-fly.top:48996/jp").then((res)=>{
                    return res.text();
                }))
            }
            else if((addPrefixJudge(session.content,"切换国际服")||addPrefixJudge(session.content,"切国际服"))&&await authCheck(session.userId,session,1)){
                session.send(await fetch("http://frp-fly.top:48996/en").then((res)=>{
                    return res.text();
                }))
            }
            else if((addPrefixJudge(session.content,"切换音击")||addPrefixJudge(session.content,"切音击"))&&await authCheck(session.userId,session,1)){
                session.send(await fetch("http://frp-fly.top:48996/ongeki").then((res)=>{
                    return res.text();
                }))
            }
            else if(addPrefixJudge(session.content,"重启")&&await authCheck(session.userId,session,0)){
                session.send(await fetch("http://frp-fly.top:48996/restart").then((res)=>{
                    return res.text();
                }))
            }
            else if(addPrefixJudge(session.content,"关hdd")&&await authCheck(session.userId,session,0)){
                session.send(await fetch("http://frp-fly.top:48996/shut").then((res)=>{
                    return res.text();
                }))
            }
            else if (addPrefixJudge(session.content, "test") && await authCheck(session.userId, session, 0)) {
                const prisma = new PrismaClient();
                async function main() {
                    await prisma.billingOperator.delete({where:{id:3}});
                }
                main().then(() => {
                    prisma.$disconnect();
                })
            }
        }
    })
    ctx.command('checkAlive').action((_) => {
        let date = new Date()
        return 'Bot还活着.\n' + date.toLocaleString();
    })
}