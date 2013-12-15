Qlikview File System Access
===========================

### This project is still under (heavy) development! Use it very careful!!!

Qlikview File System Access (QVFSA for short) is a node.js app that have a few mthods for performing file system operations
which can be called from insude Qlikview script. This app must be started on the machine where the raw data files are 
stored.


#### Why node.js? 

Sometimes the files, which need to be loaded, are stored on non windows machines. This app can be started on evey machine
which have node.js installed.


#### Methods
* /deletefile/[file] - delete a single file
* /deletefolder/[folder] - delete folder and itss content (files and subfolders)
* /clearfolderfiles/[folder] - delete all files inside the specified folder. All subfolders will NOT be deleted
* /clearfolderall/[folder] - delete all files and subfolders inside the specified folder
* /qvscriptslist - the app allows to host static files. The idea is to host predefined qv scripts which can be called from qv itself
* /qvscripts/:file - return the content of the specified txt file. See blow how to include the file in qv

#### Specifics
  * the file and folder names must contain the full path
  * the file and folder names must be url encoded (how to implement url encoding inside QV script see the part below)

#### URL encoding inside QlikView

Before send the request to the app from inside the qlikview the path must be url encoded. The mapping table below can be used to encode the path:

    URLEncode:
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
        ']'     , '%5D' 
        '>'     , '%3E' 
        '<'     , '%3C' 
        chr(39) , '%27' 
    ];

After the mapping table is created MapSubString function can be used to encode the string: 

    MapSubstring('URLEncode', FileToDelete)

#### Inclide hosted script
The /qvscriptslist will return list with all available scripts. The script are stored in \static\qvscripts folder. For example the url encoding table might be one of this scripts. Let's this script file is named qv_urlencode_mapping.txt. So to include this script in script editor in QV must type:

    $(Include=http://localhost:3001/qvscripts/qv_urlencode_mapping.txt);

Using the above incldue clause will create the url encoding mapping table in QV so there is no need to paste the table in all files that is used.

#### What's next
  * clean the code
  * add new methods for rename files/folders, copy/move files/folders, zip/unzip
