#!/bin/bash

# Script לדחיפת הקוד ל-GitHub

echo "🔍 בודק התחברות ל-GitHub..."
gh auth status

if [ $? -ne 0 ]; then
    echo "❌ לא מחובר ל-GitHub"
    echo "🔐 מתחבר עכשיו..."
    gh auth login --web
    echo "✅ התחברות הושלמה!"
fi

echo "📤 דוחף קוד ל-GitHub..."
cd /Users/harelhalperin/Desktop/food
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ הקוד נדחף בהצלחה!"
    echo "🌐 לך ל: https://github.com/davidhalperin0-cyber/ai-waiter"
else
    echo "❌ שגיאה בדחיפה. נסה שוב."
fi

