if [ "$ver" == "" ]; then
ver=1.0.0
fi

# [System.Environment]::SetEnvironmentVariable('ver','1.2024.04.07-beta')
# docker build -t "scholtz2/biatec-cron-api:1.2024.04.07-beta" -f Dockerfile ..

echo "docker build -t \"scholtz2/biatec-cron-api:$ver-main\" -f server.Dockerfile .."
nice -n 20 docker build -t "scholtz2/biatec-cron-api:$ver-main" -f server.Dockerfile .. || error_code=$?
if [ "$error_code" != "" ]; then
echo "$error_code";
    echo "failed to build";
	exit 1;
fi

docker push "scholtz2/biatec-cron-api:$ver-main" || error_code=$?
if [ "$error_code" != "" ]; then
echo "$error_code";
    echo "failed to push";
	exit 1;
fi

echo "Image: scholtz2/biatec-cron-api:$ver-main"


echo "docker build -t \"scholtz2/biatec-cron-executor:$ver-main\" -f executor.Dockerfile .."
nice -n 20 docker build -t "scholtz2/biatec-cron-executor:$ver-main" -f executor.Dockerfile .. || error_code=$?
if [ "$error_code" != "" ]; then
echo "$error_code";
    echo "failed to build";
	exit 1;
fi

docker push "scholtz2/biatec-cron-executor:$ver-main" || error_code=$?
if [ "$error_code" != "" ]; then
echo "$error_code";
    echo "failed to push";
	exit 1;
fi

echo "Image: scholtz2/biatec-cron-executor:$ver-main"

