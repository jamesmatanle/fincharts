URL='https://www.federalreserve.gov/datadownload/Output.aspx?rel=H15&series=bf17364827e38702b42a58cf8eaa3f78&lastobs=&from=&to=&filetype=csv&label=include&layout=seriescolumn&type=package'
SERVER="james@$DO_IP"

dev() {
    echo 'opening browser and port 8888...'
    open 'http://localhost:8888/public'
    python3 -m http.server 8888
}

download_csv() {
    echo 'downloading csv...'
    curl -o ./public/frb.csv $URL
}

upload_csv() {
    echo 'copying csv to server...'
    scp ./public/frb.csv ${SERVER}:/var/www/jamesmatanle.com/html/fincharts/frb.csv
}

sync_public() {
    echo 'copying public all site files to server...'
    rsync --verbose --progress --archive -zLcb ./public/ ${SERVER}:/var/www/jamesmatanle.com/html/fincharts/
}

install_cron() {
    echo "@weekly curl -o /var/www/jamesmatanle.com/html/fincharts/ $URL >> /tmp/datacronout" > /tmp/datacron
    scp /tmp/datacron ${SERVER}:/tmp/datacron
    # ssh -t $SERVER 'sudo apt update; sudo apt install cron; sudo systemctl enable cron'
    ssh -t $SERVER 'sudo mv /tmp/datacron /var/spool/cron/crontabs/datacron'
}

all() {
    download_data
    sync_public
}

if [ $# -eq 0 ]; then
    echo "usage: $0 <function>"
    exit 1
fi

$@
