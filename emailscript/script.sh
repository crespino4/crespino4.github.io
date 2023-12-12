#!/bin/zsh
gc routing queues list --autopaginate --filtercondition="name==Customer Support" --transform=./analyticsQuery.gotmpl > analyticsQuery.json
gc analytics conversations details query create --file=./analyticsQuery.json --inputformat=JSON --transformstr="{{- range .conversations -}}{{.conversationId}}\r\n{{- end -}}" > conversationIds.txt
cat conversationIds.txt | IFS=$'\n' read -r -d '' -A lines
for line in "${(@f)lines}"
{
    echo $line
    gc conversations disconnect create $line
}