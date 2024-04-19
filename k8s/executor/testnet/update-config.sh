kubectl apply -f deployment-main.yaml -n biatec

kubectl rollout restart deployment/biatec-cron-executor-1-deployment -n biatec
# kubectl rollout status deployment/biatec-cron-executor-1-deployment -n biatec