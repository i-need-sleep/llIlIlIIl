git init
PAUSE
heroku git:remote -a the0thing
git add .
git commit -am "anotherfix"
git push heroku master
ECHO DONE
PAUSE