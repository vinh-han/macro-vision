#!/usr/bin/env bash

file_name=$1
json_out="scraped.json"

# Make sure input file exists
if [ ! -f "$file_name" ]; then
    echo "Not a file"
    exit 1
fi

# Collapse each <tr> ... </tr> into one line
tr -d '\n' < "$file_name" | sed 's#</tr>#</tr>\n#g' |
while read -r row; do
    echo "$row" \
    | grep -oP '(?<=<td).*?(?=</td>)' \
    | sed 's/^>//' \
    | sed -E 's/<img[^>]*src="([^"]+)".*/\1/g' \
    | sed 's/<br><i>/~~ALT~~/g' \
    | sed 's/<[^>]*>//g' \
    | tr -s ' ' \
    | paste -sd'|' -
done | jq -R -s '
  split("\n")[:-1] |
  map(
    split("|") as $f |
    # split the first field into name + alt_names
    (($f[0] // "") | split("~~ALT~~")) as $names |
    {
      name: $names[0],
      alt_names: ($names[1:] | map(select(. != "" and . != null))),
      image_url: (($f[1] // "") | sub("^//"; "https://")),
      region: ($f[2] // ""),
      description: ($f[3] // "")
    }
  )
' > "$json_out"

