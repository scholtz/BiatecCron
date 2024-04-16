kubectl apply -f deployment-main.yaml -n biatec
#kubectl delete configmap awallet-main-conf -n biatec
#kubectl create configmap awallet-main-conf --from-file=conf -n biatec
kubectl rollout restart deployment/biatec-cron-api-deployment -n biatec
kubectl rollout status deployment/biatec-cron-api-deployment -n biatec