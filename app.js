var express     = require('express');
var http        = require('http');
var fs          = require('fs');
var app         = express();
var walk        = require('walk');
var wrench      = require('wrench');
var util        = require('util');
var async       = require('async');
var cons        = require('consolidate');
var swig        = require('swig');
var fse         = require('fs.extra');
var EasyZip = require('easy-zip').EasyZip;

if (process.argv[2]) {
	var port = process.argv[2];
	var server		= app.listen(port);
} else {
	var port = 3001;
	var server		= app.listen(port);
}

app.configure(function() {
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  //app.use(express.session({ secret: 'keyboard cat' }));
  //app.use(passport.initialize());
  //app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/static'));  
  app.engine('.html', cons.swig);
  app.set('view engine', 'html');
});

app.get('/zipfolder/:foldepath/:topath', function(req, res){ 
  var path = req.params.foldepath;
  path = path.replace(/\\/g, "/");
  
  var topath = req.params.topath;
  topath = topath.replace(/\\/g, "/");  
  
  fs.exists(path, function (exists) {
     if(exists === true) {
      var zip = new EasyZip();
      zip.zipFolder(path ,function(){
        zip.writeToFileSycn(topath);
        res.send('%Status; %Object;%Message\nerror;'+path.replace(/\//g, "\\")+';Folder zipped to ' + topath.replace(/\//g, "\\"));
      });
     } else {
       res.send('%Status; %Object;%Message\nerror;'+path.replace(/\//g, "\\")+';Folder don\'t exists'); 
     }
  });
});

app.get('/zipfile/:filepath/:topath/:filename', function(req, res){ 
  var path = req.params.filepath;
  path = path.replace(/\\/g, "/");
  
  var topath = req.params.topath;
  topath = topath.replace(/\\/g, "/");  
  
  var filename = req.params.filename;
  
  fs.exists(path, function (exists) {
     if(exists === true) {
      var zip = new EasyZip();
      zip.addFile(filename, path ,function(){
        zip.writeToFileSycn(topath);
        res.send('%Status; %Object;%Message\nerror;'+path.replace(/\//g, "\\")+';File zipped to ' + topath.replace(/\//g, "\\"));
      });
     } else {
       res.send('%Status; %Object;%Message\nerror;'+path.replace(/\//g, "\\")+';File don\'t exists ' + path.replace(/\//g, "\\")); 
     }
  });
});

app.get('/', function(req,res) {
	res.sendfile('static/index.html');
});

app.get('/about', function(req,res) {
	res.sendfile('static/about.html');
});

app.get('/qvscripts/:file', function(req, res){
    var file = req.params.file;
    res.sendfile('static/qvscripts/' + file);
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
	//console.log(path);
	path = path.replace(/\\/g, "/");
  
   fs.exists(path, function (exists) {
     if(exists === false) {
       res.send('%Status; %Object;%Message\nerror;'+path.replace(/\//g, "\\")+';Folder don\'t exists');
      } else {
        wrench.rmdirSyncRecursive(path);
        res.send('%Status; %Object;%Message\nok;'+path.replace(/\//g, "\\")+';Folder deleted');
    }
	}); 
 });
	
app.get('/deletefile/:file', function(req, res){
	var path = req.params.file;
	path = path.replace(/\\/g, "/");
    fs.exists(path, function (exists) {
    if(exists === false) {
      res.send('%Status; %Object;%Message\nerror;'+path.replace(/\//g, "\\")+';File don\'t exists');
    } else {
		fs.unlink(path, function (err) {
			if (err) { 
				res.send('%Status; %Object;%Message\nerror;'+path.replace(/\//g, "\\")+';'+err); 
			} else {
				res.send('%Status; %Object;%Message\nok;'+path.replace(/\//g, "\\")+';File deleted');
			}
		});
    }
	});
});	

app.get('/clearfolderfiles/:folder', function(req, res){
	var path = req.params.folder;
	
	path = path.replace(/\\/g, "/");
	var filesArray = [];
	fs.readdir(path, function (err, files) {
    if (err) {
      res.send('%Status; %Object;%Message\nerror;'+path.replace(/\//g, "\\")+';'+err); 
    }
		try{
			async.each(files,  function( file, callback){
				fs.lstat(path + '/' +file, function(err, stats) {
         if (stats.isDirectory() === false) {
						filesArray.push(file);
					}
					callback();
				});
				
			}, function(err){
					if( err ) {
            res.send('%Status; %Object;%Message\nerror;'+path.replace(/\//g, "\\")+';'+err); 
					} else {
            for(var i = 0; i < filesArray.length; i++) {
              fs.unlink(path + '/' + filesArray[i]);
            }
            res.send('%Status; %Object;%Message\nok;'+path.replace(/\//g, "\\")+';All files deleted'); 
					}  
				}	
			);
		} catch (e) {}
	});	
});	

app.get('/clearfolderall/:folder', function(req, res){
	var path = req.params.folder;	
	path = path.replace(/\\/g, "/");

  fs.exists(path, function (exists) {
  if(exists === false) {
	res.send('%Status; %Object;%Message\nerror;'+path.replace(/\//g, "\\")+';Folder don\'t exists');
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
          res.send('%Status; %Object;%Message\nerror;'+path.replace(/\//g, "\\")+';'+err);
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
							res.send('%Status; %Object;%Message\nok;'+path.replace(/\//g, "\\")+';Folder cleared');
						});						
					});
				}  
			});	
	});
	}});
});	

app.get('/rename/:oldname/:newname', function(req, res){
	var oldname = req.params.oldname;
	oldname = oldname.replace(/\\/g, "/");
	
	var newname = req.params.newname;
	newname = newname.replace(/\\/g, "/");
	
  fs.exists(oldname, function (exists) {
    if(exists === false) {
      res.send('%Status; %Object;%Message\nerror;' + oldname.replace(/\//g, "\\") + ';File don\'t exists');
    } else {
      fs.rename(oldname, newname, function (err) {
        if (err) { 
          res.send('%Status; %Object;%Message\nerror;'+ oldname.replace(/\//g, "\\") + ';'+err); 
        } else {
          res.send('%Status; %Object;%Message\nok;' + oldname.replace(/\//g, "\\") + ';Renamed');
        }
      });
    }
  });
});

app.get('/mkdir/:dirname', function(req, res){
	var dirname = req.params.dirname;
	dirname = dirname.replace(/\\/g, "/");
	
  fse.mkdirp(dirname, function (err) {
    if (err) {
      res.send('%Status; %Object;%Message\nerror;'+ dirname.replace(/\//g, "\\") + ';'+err);
    } else {
      res.send('%Status; %Object;%Message\nok;' + dirname.replace(/\//g, "\\") + ';Folder created');
    }
  });
});

app.get('/move/:frompath/:topath', function(req, res){
	var frompath = req.params.frompath;
	frompath = frompath.replace(/\\/g, "/");
	
	var topath = req.params.topath;
	topath = topath.replace(/\\/g, "/");
	
  fse.move(frompath, topath, function (err) {
    if (err) {
      res.send('%Status; %Object;%Message\nerror;'+ frompath.replace(/\//g, "\\") + ';'+err);
    } else {
      res.send('%Status; %Object;%Message\nok;' + frompath.replace(/\//g, "\\") + ';Moved');
    }
  });
});

app.get('/copy/:frompath/:topath', function(req, res){
	var frompath = req.params.frompath;
	frompath = frompath.replace(/\\/g, "/");
	
	var topath = req.params.topath;
	topath = topath.replace(/\\/g, "/");
	
  fse.copy(frompath, topath, function (err) {
    if (err) {
      res.send('%Status; %Object;%Message\nerror;'+ frompath.replace(/\//g, "\\") + ';'+err);
    } else {
      res.send('%Status; %Object;%Message\nok;' + frompath.replace(/\//g, "\\") + ';Copied');
    }
  });
});

function compare(a,b) {
  if (a.id > b.id)
     return -1;
  if (a.id < b.id)
    return 1;
  return 0;
}

console.log('Server started at port ' + port);