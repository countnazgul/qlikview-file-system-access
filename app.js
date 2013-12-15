var express		= require('express');
var http		= require('http');
var fs			= require('fs');
var app			= express();
var port		= 3001;
var server		= app.listen(port);
var walk		= require('walk');
var wrench		= require('wrench');
var util		= require('util');
var async		= require('async');
var cons        = require('consolidate');
var swig        = require('swig');

//app.set("view options", {layout: false});//
app.use(express.static(__dirname + '/static'));

app.configure(function() {
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat' }));
  //app.use(passport.initialize());
  //app.use(passport.session());
  app.use(app.router);
  app.use("/", express.static(__dirname + '/'));
  app.engine('.html', cons.swig);
  app.set('view engine', 'html');
});

app.get('/', function(req,res) {
	res.sendfile('static/index.html');
});

app.get('/about', function(req,res) {
	res.sendfile('static/about.html');
});

app.get('/qvscripts/:file', function(req, res){
    var file = req.params.file;
    res.sendfile('static/qvscripts/' + file + '.txt');
});

app.get('/qvscriptslist', function(req, res){
	var qvscripts = { files : []};
	var walker  = walk.walk(__dirname + '/static/qvscripts/', { followLinks: false });

	walker.on('file', function(root, stat, next) {
		qvscripts.files.push( {name: stat.name});
		next();
	});
	
	walker.on('end', function() {
		res.render(__dirname + '/static/qvscriptslist.html', { qvscripts: qvscripts.files});
	});
});

app.get('/deletefolder/:folder', function(req, res){
	var path = req.params.folder;
	console.log(path);
	path = path.replace(/\\/g, "/")
  
   fs.exists(path, function (exists) {
	  if(exists == false) {
		res.send('%Status; %Object;%Message\nerror;'+path.replace(/\//g, "\\")+';Folder don\'t exists!');
	  } else {
		wrench.rmdirSyncRecursive(path);
		res.send('%Status; %Object;%Message\nOK;'+path.replace(/\//g, "\\")+';Folder deleted!');
	  }
	}); 
 });
	
app.get('/deletefile/:file', function(req, res){
	var path = req.params.file;
	path = path.replace(/\\/g, "/")
    fs.exists(path, function (exists) {
	  if(exists == false) {
		res.send('%Status; %Object;%Message\nerror;'+path.replace(/\//g, "\\")+';File don\'t exists!');
	  } else {
		fs.unlink(path, function (err) {
			if (err) { res.send('Status; Message\nerror; File don\'t exists!'); }
			else {res.send('Status; Message\nok; File deleted!');}
		});
	  }
	});
});	

app.get('/clearfolderfiles/:folder', function(req, res){
	var path = req.params.folder;
	
	path = path.replace(/\\/g, "/")
	var filesArray = [];
	fs.readdir(path, function (err, files) {
	  if (err) {
		res.send('Status; Message \n error; '+ err);
		//break;
		//throw err;
	  }
		try{
			async.each(files,  function( file, callback){
				fs.lstat(path + '/' +file, function(err, stats) {
					if (stats.isDirectory() == false) {
						filesArray.push(file);
					}
					callback();
				});
				
			}, function(err){
					if( err ) {
					  res.send('Status, Message\nerror,'+ err);
					} else {
					  for(var i = 0; i < filesArray.length; i++) {
						fs.unlink(path + '/' + filesArray[i]);
					  }
					  res.send('Status, Message \n OK, All files deleted');
					}  
				}	
			);
		} catch (e) {}
	});	
});	

app.get('/clearfolderall/:folder', function(req, res){
	var path = req.params.folder;	
	path = path.replace(/\\/g, "/")

  fs.exists(path, function (exists) {
  if(exists == false) {
	res.send('%Status; %Object;%Message\nerror;'+path.replace(/\//g, "\\")+';Folder don\'t exists!');
  } else {
	var obj   = {files : [], folders : [] };
	var folders = [];

	var walker  = walk.walk(path, { followLinks: false });

	walker.on('file', function(root, stat, next) {
		obj.files.push({ name : root + '/' + stat.name});
		next();
	});
	
	walker.on('directories', function(root, stat, next) {		
		for(var r = 0; r < stat.length; r++) {			
			obj.folders.push({ id : r, name : root + '/' + stat[r].name});
		}
		next();
	});

	walker.on('end', function() {
		async.each(obj.files,  function( file, callback){
				fs.unlinkSync(file.name);
				callback();			
		}, function(err){
				if( err ) {
				  console.log('Error');
				} else {
					var i = 0;
					var delFolders = [];
					async.each(obj.folders,  function( folder, callbackFolder){
						delFolders.push( { id : i, name : folder.name} );
						i++;
						callbackFolder();
					}, function(err){					
						delFolders.sort(compare);
						async.each(delFolders,  function( folder, callbackFolder){
							fs.rmdirSync(folder.name);
							callbackFolder();
						}, function(err) {
							res.send('%Status; %Object;%Message\nOK;'+path.replace(/\//g, "\\")+';Folder cleared!');
						});						
					});
				}  
			});	
	});
	}});
});	

function compare(a,b) {
  if (a.id > b.id)
     return -1;
  if (a.id < b.id)
    return 1;
  return 0;
}


console.log('Server started at port ' + port)