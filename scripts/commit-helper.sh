#!/bin/bash

# Interactive Commit Helper
# Helps create properly formatted commit messages

set -e

echo "📝 Commit Message Helper"
echo "======================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Commit types
declare -a TYPES=(
  "feat:New feature"
  "fix:Bug fix"
  "docs:Documentation changes"
  "style:Code style changes"
  "refactor:Code refactoring"
  "perf:Performance improvements"
  "test:Adding or updating tests"
  "build:Build system or dependencies"
  "ci:CI/CD configuration"
  "chore:Other changes"
  "revert:Revert a previous commit"
  "wip:Work in progress"
  "hotfix:Critical bug fix"
)

# Function to select commit type
select_type() {
  echo -e "${CYAN}Select commit type:${NC}"
  echo ""
  
  for i in "${!TYPES[@]}"; do
    IFS=':' read -r type desc <<< "${TYPES[$i]}"
    printf "  ${YELLOW}%2d)${NC} ${GREEN}%-10s${NC} - %s\n" $((i+1)) "$type" "$desc"
  done
  
  echo ""
  read -p "Enter number (1-${#TYPES[@]}): " type_choice
  
  if [[ $type_choice -ge 1 && $type_choice -le ${#TYPES[@]} ]]; then
    IFS=':' read -r COMMIT_TYPE _ <<< "${TYPES[$((type_choice-1))]}"
  else
    echo -e "${RED}Invalid selection${NC}"
    exit 1
  fi
}

# Function to get scope
get_scope() {
  echo ""
  echo -e "${CYAN}Enter scope (optional, e.g., auth, api, frontend):${NC}"
  read -p "Scope: " SCOPE
}

# Function to get subject
get_subject() {
  echo ""
  echo -e "${CYAN}Enter commit subject (imperative mood, max 50 chars):${NC}"
  echo -e "${YELLOW}Examples: 'add user authentication', 'fix memory leak', 'update dependencies'${NC}"
  
  while true; do
    read -p "Subject: " SUBJECT
    
    if [ -z "$SUBJECT" ]; then
      echo -e "${RED}Subject cannot be empty${NC}"
    elif [ ${#SUBJECT} -gt 50 ]; then
      echo -e "${RED}Subject too long (${#SUBJECT}/50 chars)${NC}"
    else
      break
    fi
  done
}

# Function to get body
get_body() {
  echo ""
  echo -e "${CYAN}Enter commit body (optional, explain what and why):${NC}"
  echo -e "${YELLOW}Press Enter twice to finish${NC}"
  
  BODY=""
  while IFS= read -r line; do
    [[ -z "$line" ]] && break
    BODY="${BODY}${line}\n"
  done
}

# Function to get breaking change
get_breaking_change() {
  echo ""
  read -p "Is this a breaking change? (y/N): " -n 1 -r
  echo
  
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${CYAN}Describe the breaking change:${NC}"
    read -p "> " BREAKING_CHANGE
  fi
}

# Function to get issues
get_issues() {
  echo ""
  echo -e "${CYAN}Related issues (optional, e.g., #123, #456):${NC}"
  read -p "Issues: " ISSUES
}

# Main flow
echo -e "${BLUE}Let's create a properly formatted commit message!${NC}"
echo ""

# Check for staged changes
if ! git diff --cached --quiet; then
  echo -e "${GREEN}✓ Found staged changes${NC}"
else
  echo -e "${YELLOW}⚠ No staged changes found${NC}"
  read -p "Do you want to stage all changes? (y/N): " -n 1 -r
  echo
  
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add -A
    echo -e "${GREEN}✓ All changes staged${NC}"
  else
    echo "Please stage your changes first: git add <files>"
    exit 1
  fi
fi

# Show staged changes
echo ""
echo -e "${CYAN}Staged changes:${NC}"
git diff --cached --stat
echo ""

# Build commit message
select_type
get_scope
get_subject
get_body
get_breaking_change
get_issues

# Construct commit message
if [ -n "$SCOPE" ]; then
  COMMIT_MSG="${COMMIT_TYPE}(${SCOPE}): ${SUBJECT}"
else
  COMMIT_MSG="${COMMIT_TYPE}: ${SUBJECT}"
fi

if [ -n "$BODY" ]; then
  COMMIT_MSG="${COMMIT_MSG}\n\n${BODY}"
fi

if [ -n "$BREAKING_CHANGE" ]; then
  COMMIT_MSG="${COMMIT_MSG}\n\nBREAKING CHANGE: ${BREAKING_CHANGE}"
fi

if [ -n "$ISSUES" ]; then
  COMMIT_MSG="${COMMIT_MSG}\n\nCloses: ${ISSUES}"
fi

# Preview commit message
echo ""
echo -e "${CYAN}=== Commit Message Preview ===${NC}"
echo -e "$COMMIT_MSG"
echo -e "${CYAN}==============================${NC}"

# Confirm and commit
echo ""
read -p "Create this commit? (Y/n): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Nn]$ ]]; then
  echo -e "$COMMIT_MSG" | git commit -F -
  
  if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Commit created successfully!${NC}"
    
    # Show commit details
    git log -1 --stat
    
    # Ask about pushing
    echo ""
    read -p "Push to remote? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      git push
      echo -e "${GREEN}✅ Pushed to remote!${NC}"
    fi
  else
    echo -e "${RED}❌ Commit failed${NC}"
    exit 1
  fi
else
  echo "Commit cancelled"
  exit 0
fi