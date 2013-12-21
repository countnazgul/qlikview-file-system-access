QlikView File System Access (QVFSA)
=====================
QVFSA is a node.js application that expose few file system methods which can be called from inside QlikView script. Each methods return semicolumn separated table which can be read from QlikView.

For example the create folder method can be called like this:

    %QVFSA_Response:
	Load 
		%Status, 
     	%Object, 
    	%Message
	From [http://localhost:3001/mkdir/c:%5CNewFolder] (txt, codepage is 1252, embedded labels, delimiter is ';', msq);

and the result table will contain %Status ("ok" or "error"), %Object (in our case "c:\NewFolder") and  %Message (if status is "ok" - "Folder created", if "error" - the error message)

#### Installation

  - Download and install node.js (http://nodejs.org/download/)
  - git clone this repo (https://github.com/countnazgul/qlikview-file-system-access.git)
  - open command prompt and navigate to new created folderinstall and install node modules 
  
  > npm install

  - run the server

    > node app.js

  ** the server accept port as parameter. If port is not specified 3001 will be used
  > node app.js 3005

#### Methods
* /deletefile/[file] - delete a single file
* /deletefolder/[folder] - delete folder and itss content (files and subfolders)
* /clearfolderfiles/[folder] - delete all files inside the specified folder. All subfolders will NOT be deleted
* /clearfolderall/[folder] - delete all files and subfolders inside the specified folder
* /qvscriptslist - the app allows to host static files. The idea is to host predefined qv scripts which can be called from qv itself
* /qvscripts/[file] - return the content of the specified txt file. See blow how to include the file in qv  
* /rename/[oldname]/[newname] - rename file/folder from "oldname" to "newname"
* /mkdir/[dirname] - create an empty folder
* /move/[frompath]/[topath] - move file/folder "frompath" to "topath". For files "topath" must include and filename
* /copy/[frompath/[topath] - copy file/folder "frompath" to "topath". For files "topath" must include and filename
* /zipfolder/[foldepath]/[topath] - zip folder (:filepath) to specific location (:topath)
* /zipfile/[filepath]/[topath]/[filename] - zip single file (:filepath) to specific location (:topath) and name the zip file (:filename)
* /unzip/[filepath]/[topath] - unzip zip file to specific path
* /exists/[path] - check if destination path (file/folder) exists. If not exists "error" status is returned

#### URL encoding inside QlikView

All file and folder names must be url encoded!

Before send the request to the app from inside the qlikview the path must be url encoded. The mapping table below can be used to encode the path:

    %QVFSA_URLEncode:
      Mapping Load * Inline [
        String  , UrlString
        '%'     , '%25'
        '#'     , '%23' 
        ' '     , '%20' 
        '$'     , '%24' 
        '&'     , '%26' 
        '+'     , '%2B' 
        ','     , '%2C' 
        '/'     , '%2F' 
        '\'     , '%5C' 
        ':'     , '%3A' 
        ';'     , '%3B' 
        '='     , '%3D' 
        '?'     , '%3F' 
        '@'     , '%40' 
        '['     , '%5B' 
        '>'     , '%3E' 
        '<'     , '%3C' 
        chr(39) , '%27' 
      ];

After the mapping table is created MapSubString function can be used to encode the string: 

    MapSubstring('URLEncode', FileToDelete)

#### QlikView Usage
There is a ready QV scripts in /static/qvscripts folder which can be used to access the mehods

Here is an example of using the app from inside QlikView:
    
    set vRawDataFolder =  c:\qvw\data;
    for each File in filelist ( '$(vRawDataFolder)' & '*.csv' )
    
	  DataTable:
	  Load 
		*
	  From $(File) (txt, codepage is 1252, embedded labels, delimiter is ',', msq);

      let vQVFSA_ForDelete = '$(File)'; // path object to be deleted
      set vQVFSA_Url = http://localhost:3001; // the url where app can be reached
      set vQVFSA_method = deletefile; // method which will be used
      $(Include=$(vQVFSA_Url)/qvscripts/qvfsa_delete.txt); // include the code

    next

All predefined scripts include errorMode variable set so if there are any errors during the script execution the main script will continue.

There is an example qvw file (/static/qvw/QVFSA_Example.qvw) in which all the available scripts are ready and can be used in other qvw apps.

#### Include hosted script
The /qvscriptslist method will return list with all available scripts. The script are stored in /static/qvscripts folder. For example the url encoding table might be one of this scripts. Let's this script file is named qv_urlencode_mapping.txt. So to include this script in script editor in QV must type:

    $(Include=http://localhost:3001/qvscripts/qv_urlencode_mapping.txt);

Using the above include clause will create the url encoding mapping table in QV so there is no need to paste the table in all files that is used.

#### What's next
  * more detailed tests of the available methods
  * ftp/sftp support?

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/countnazgul/qlikview-file-system-access/trend.png)](https://bitdeli.com/free "Bitdeli Badge")