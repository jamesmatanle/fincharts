URL="'https://www.federalreserve.gov/datadownload/Output.aspx?rel=H15&series=bf17364827e38702b42a58cf8eaa3f78&lastobs=&from=&to=&filetype=csv&label=include&layout=seriescolumn&type=package'"
SERVER="james@$DO_IP"

dev() {
    open 'http://localhost:8888/public'
    python3 -m http.server 8888
}

download_csv() {
    echo $URL | xargs curl -o ./public/frb.csv
}

sync_public() {
    rsync --verbose --progress --archive -zLcb ./public/ ${SERVER}:/var/www/jamesmatanle.com/html/fincharts/
}

sync_conf() {
    echo "#!/bin/bash\ncurl -o '/var/www/jamesmatanle.com/html/fincharts/frb.csv' $URL &> ~/datacronout" | tee /tmp/datacron
    chmod +x /tmp/datacron
    scp /tmp/datacron ${SERVER}:/tmp/datacron
    ssh -t $SERVER 'sudo mv /tmp/datacron /etc/cron.daily/datacron'
    # ssh -t $SERVER 'sudo apt update; sudo apt install cron; sudo systemctl enable cron'
    scp ./conf/jamesmatanle.com.conf ${SERVER}:/tmp/conf
    ssh -t $SERVER 'sudo mv /tmp/conf /etc/nginx/sites-available/jamesmatanle.com && sudo ln -sf /etc/nginx/sites-available/jamesmatanle.com /etc/nginx/sites-enabled/ && service nginx restart'
}

if [ $# -eq 0 ]; then
    echo "usage: $0 <function>"
    exit 1
fi

$@
