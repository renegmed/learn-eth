rsync -r src/ docs/
rysnc build/contracts/ChainList.json docs/
rysnc build/contracts/Ownable.json docs/
git add .
git commit -m "adding frontend files to Github pages"
git push
