#!/bin/bash
# Create task as Sid (with proper activity logging)
# Usage: ./create-task.sh "Task Title" "Task description..."

TITLE="$1"
DESCRIPTION="$2"

if [ -z "$TITLE" ] || [ -z "$DESCRIPTION" ]; then
  echo "Usage: ./create-task.sh 'Task Title' 'Task description'"
  exit 1
fi

cd ~/clawd/src/mission-control

# Create the task
TASK_RESULT=$(npx convex run tasks:create "{\"title\": \"$TITLE\", \"description\": \"$DESCRIPTION\", \"status\": \"inbox\"}")
TASK_ID=$(echo "$TASK_RESULT" | tr -d '"')

echo "Created task: $TASK_ID"

# Log activity as Sid
npx convex run activities:create "{
  \"type\": \"task_created\",
  \"message\": \"Created task: $TITLE\",
  \"agentId\": \"j9763wx5b2cfhxhax62sj9ewcx80d9n0\",
  \"taskId\": \"$TASK_ID\"
}"

echo "Activity logged (created by Sid)"
echo "Task ID: $TASK_ID"
