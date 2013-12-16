
QlikView File System Access	{#welcome}
=====================
The idea of File system access is to be used from inside QlikView. QlikView can't handle delete files/folders from script while execution of extenal files is not checked, which will show warning message every time when reload is started. 

From inside QlikView File System Access can be called like load data from web page.

#### Methods
* /deletefile/[file] - delete a single file
* /deletefolder/[folder] - delete folder and itss content (files and subfolders)
* /clearfolderfiles/[folder] - delete all files inside the specified folder. All subfolders will NOT be deleted
* /clearfolderall/[folder] - delete all files and subfolders inside the specified folder
* /qvscriptslist - the app allows to host static files. The idea is to host predefined qv scripts which can be called from qv itself
* /qvscripts/:file - return the content of the specified txt file. See blow how to include the file in qv  
      
#### Specifics
  * the file and folder names must contain the full path
  * the file and folder names must be url encoded (see the part below)

#### URL encoding inside QlikView

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
There is a ready QV script (qvfsa_delete.txt) which can be used to access the mehods

Here is an example of using the app from inside QlikView:

    // Loop throug files in folder, load the data from the files, 
    // store the data in qvd and delete the raw data files
    
    set vRawDataFolder =  c:\test\;
    for each File in filelist ( '$(vRawDataFolder)' & '*.csv' )
    
	  DataTable:
	  Load 
		*
	  From $(File) (txt, codepage is 1252, embedded labels, delimiter is ',', msq);

      let vQVFSA_ForDelete = '$(File)'; // path object to be deleted
  set vQVFSA_Url = http://192.168.1.106:3001; // the url where app can be reached
  set vQVFSA_method = deletefile; // method which will be used
  $(Include=$(vQVFSA_Url)/qvscripts/qvfsa_delete.txt); // include the code

    next

The qvfsa_delete.txt include errorMode variable set so if there any errors during the deletion script execution the main script will continue.

Example qvw file can be found in \static\qvw folder.

#### Include hosted script
The /qvscriptslist will return list with all available scripts. The script are stored in \static\qvscripts folder. For example the url encoding table might be one of this scripts. Let's this script file is named qv_urlencode_mapping.txt. So to include this script in script editor in QV must type:

    $(Include=http://localhost:3001/qvscripts/qv_urlencode_mapping.txt);

Using the above include clause will create the url encoding mapping table in QV so there is no need to paste the table in all files that is used.

#### What's next
  * code clean up
  * add new methods for rename files/folders, copy/move files/folders, zip/unzip