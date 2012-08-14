#!/bin/bash

installModule () {
	if [ $(npm ls | grep -c $1) == 1 ]
	then
		echo "$1 already installed"
	else
		echo "installing $1"
		npm install $1
	fi
}

installModule jsdom
installModule xmlhttprequest
installModule jquery
installModule requirejs
