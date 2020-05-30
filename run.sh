dev() {
    echo 'opening browser and port 8888...'
    open 'http://localhost:8888/public'
    python3 -m http.server 8888
}

download_data() {
    echo 'downloading fresh data...'
    curl -o ./public/frb.csv 'https://www.federalreserve.gov/datadownload/Output.aspx?rel=H15&series=bf17364827e38702b42a58cf8eaa3f78&lastobs=&from=&to=&filetype=csv&label=include&layout=seriescolumn&type=package'
}

copy_data() {
    echo 'copying data to server...'
    scp ./public/frb.csv james@${DO_IP}:/var/www/jamesmatanle.com/html/fincharts/frb.csv
}

sync_public() {
    echo 'copying public all site files to server...'
    rsync --verbose --progress --archive -zLcb ./public/ james@${DO_IP}:/var/www/jamesmatanle.com/html/fincharts/
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
