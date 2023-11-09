gc routing queues list --autopaginate --filtercondition="name==Customer Support" --transformstr='{{- range . -}}{{.id}}{{- end -}}'

gc analytics conversations details query create --file=./analyticsQuery.json --inputformat=JSON


gc conversations disconnect create 6620f0cf-987d-4587-82ce-c2e3c2ecb54a