#!/bin/bash
# arr=(http://www.baidu.com defaultPdf)
url=http://www.baidu.com
pdfName=defaultPdf
while getopts "ISUB:bN:nTHP:pLE" arg #选项后面的冒号表示该选项需要参数
do
        case $arg in
            I)
                sh ./lib/init.sh
                ;;
            P)
               sed -i '2d' pdf-cli/config/index.js
               sed -i "/exports.config = {/a\    'ports':'${OPTARG}'" pdf-cli/config/index.js
               ;;
            S)
                sh ./lib/startTool.sh
                ;;
            U)
                sh ./lib/updateTool.sh
                ;;
            N)
               pdfName=$OPTARG
                ;;
            B)
                url=$OPTARG
                ;;
            T)
            # echo $url
            # echo $pdfName
            # 读取端口数据
            port=`sed -n "2p" pdf-cli/config/index.js`
            port=${port##*:}
            port=${port:1:${#port}}
            port=${port:0:${#port}-1}
            buildTime=$(date "+%y%m%d%H%M%S")
            # echo $port
            # echo "$(date "+%Y.%m.%d")"
            if [ ! -d ./logs ]
            then mkdir logs
            fi
            if [ ! -d ./pdf ]
            then mkdir pdf
            fi
               curl "http://localhost:$port/pdf/transform" -X POST --header "c_base_url:$url" --header "c_base_folder:/pdf" --header "c_base_pdfname:$pdfName" --header "c_base_format:A4" > logs/logs_$buildTime.json
                mv ./pdf-cli/pdf/$pdfName.pdf ./pdf

               ;;
            L)
                find ./logs -type f -name "logs_$(date '+%y%m%d')*.json" > logs/today.txt
                timeymd=$(date '+%y%m%d')
                echo "今天是$(date '+%Y')年${timeymd:2:2}月${timeymd:4}日 今天的log如下"
                echo ""
                cat logs/today.txt | while read line
                do
                    newName="${line##*/logs_}"
                    allTime="${newName%%.*}"
                    timehms="${allTime##*$timeymd}"
                    echo [log生成时间]
                    echo ${timehms:0:2}:${timehms:2:2}:${timehms:4}
                    echo [log内容]
                    cat $line
                    echo ""
                done
                ;;
            E)
                if [ ! -d ./node_modules ]
                then npm i
                fi
                npm start
                ;;
            H)
            echo "命令说明"
            echo "./app.sh (-I) (-P 端口) (-S) (-U) (-N pdf名称) (-B 转换地址) (-T) (-H) (-L) (-E)"
            echo "-H：查看帮助"
            echo "./app.sh -H"
            echo "-I：初始化工具"
            echo "./app.sh -I"
            echo "-P：更改工具端口（如果端口冲突，先更改工具端口，再打开工具）"
            echo "./app.sh -P 8000"
            echo "-S：打开工具"
            echo "./app.sh -S"
            echo "-U：更新工具"
            echo "./app.sh -U"
            echo "-T：生成pdf 并自动存放入pdf文件夹"
            echo "./app..sh -T"
            echo "-N：设定pdf名称 默认pdf名称为defaultPdf 需要配合 -T 使用"
            echo "./app.sh -N newPdf -T"
            echo "-L：查看今天的log"
            echo "./app.sh -L"
            echo "-B：设定地址url 可为本地dist 也可为网络链接 需要配合-T 使用"
            echo "./app.sh -B http://www.baidu.com -T"
            echo "-T -N -B 的综合应用"
            echo "./app.sh -N newPdf -B http://www.baidu.com -T"
            echo "注意：默认的 -N 名称是$pdfName 默认 -B 的地址是$url -B 的地址可以使用绝对路径 或相对于pdf-cli目录的路径"
            echo "-E 打开dist的服务器"
            echo "./app.sh -E"
            ;;
            ?)  #当有不认识的选项的时候arg为?
            echo "请使用-H来查看帮助命令"
        # exit 1
        ;;
        esac
done
