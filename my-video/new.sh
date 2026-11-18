#!/bin/bash
# usage: ./new.sh Night   ->  creates + registers a new story called Night
N="$1"
[ -z "$N" ] && { echo "usage: ./new.sh Name"; exit 1; }
sed "s/StoryName/$N/g" src/studio/stories/_Template.tsx > "src/studio/stories/$N.tsx"
sed -i "1i import {$N} from './stories/$N';" src/studio/Root.tsx
sed -i "s|  // add new stories here|  {id: '$N', component: $N, frames: 300},\n  // add new stories here|" src/studio/Root.tsx
echo "Created src/studio/stories/$N.tsx and registered it."
