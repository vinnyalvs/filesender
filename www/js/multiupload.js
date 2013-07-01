// JavaScript Document

/*
 * FileSender www.filesender.org
 * 
 * Copyright (c) 2009-2012, AARNet, Belnet, HEAnet, SURFnet, UNINETT
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * 
 * *	Redistributions of source code must retain the above copyright
 * 	notice, this list of conditions and the following disclaimer.
 * *	Redistributions in binary form must reproduce the above copyright
 * 	notice, this list of conditions and the following disclaimer in the
 * 	documentation and/or other materials provided with the distribution.
 * *	Neither the name of AARNet, Belnet, HEAnet, SURFnet and UNINETT nor the
 * 	names of its contributors may be used to endorse or promote products
 * 	derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
 
// HTML5 Upload functions
// when cancelling an upload we need to wait till the chunk is complete before allowing the cancel to happen
// setting cancell upload to true will trigger the upload to stop before uploading the next chunk
// JavaScript Document



// -----------------------------------------------------------------------------
// Globals
// Major version of Flash required
var requiredMajorVersion = 10;
// Minor version of Flash required
var requiredMinorVersion = 0;
// Minor version of Flash required
var requiredRevision = 0;
// -----------------------------------------------------------------------------
// -->

//var bytesUploaded = 0;
//var bytesTotal = 0;
//var previousBytesLoaded = 0;
var intervalTimer = 0;
//var currentlocation = 0;
//var filename = "";
//var chunksize = 2000000;
var uploadURI = "fs_multi_upload.php";
var fdata = []; // array of each file to be uploaded
var n = -1; // file int currently uploading

// a unique is created for each file that is uploaded.
// An object with the unique stores all relevant information about the file upload

// Used for aggregate upload bar
var totalFileLengths = 0;
var totalBytesLoaded = 0;
var percentageComplete = 0;

// Used for calculating average upload speed in updatepb
var aggregateStartTime = 0;

function browse(){
	$('#fileToUpload').click();
	//return browse();
}

 	function fileSelected() {
		 //fdata = [];
		// multiple files selected
		// loop through all files and show their valudes
		//$("#filestoupload").html("");
		var files = document.getElementById("fileToUpload").files;
		if (typeof files !== "undefined") {

            for (var i=0, l=files.length; i<l; i++) {
            var dupFound = false;

                for (var j = 0; j < fdata.length; j++){
                    if (fdata[j].filename == files.item(i).name){
                        dupFound = true;
                        break;
                    }
                }

                if (!dupFound){
                    n = n + 1;
                    fdata[n] = Array(n);
                    fdata[n].filegroupid = groupid;
                    fdata[n].filetrackingcode = trackingCode;
                    fdata[n].file = files[i];
                    fdata[n].fileSize = fdata[n].file.size;
                    fdata[n].bytesTotal = fdata[n].file.size;
                    fdata[n].bytesUploaded = 0;
                    fdata[n].previousBytesLoaded = 0;
                    fdata[n].intervalTimer = 0;
                    fdata[n].currentlocation = 0;
                    fdata[n].filename = fdata[n].file.name;
                    fdata[n].name = fdata[n].file.name;
                    fdata[n].filetype = fdata[n].file.type;
                    fdata[n].valid = false; // assume invalid until checked
                    fdata[n].status = true; // to allow removal of file from upload list
                    // validate file for upload
                    // Show in list 'invalid' with reason
                    //fdata[n].filesize = 0;


                    totalFileLengths += fdata[n].fileSize;
                    $("#uploadbutton").show();
                    $("#fileInfoView").show();
                    var progressString = generateFileBoxHtml();
                    $("#draganddropmsg").hide();
                    $("#filestoupload").append(progressString);
                }
			//$("#fileName").html('Name: ' + fdata[n].filename);
			//$("#fileSize").html('Size: ' + readablizebytes(fdata[n].fileSize));
		//} else {
		 // display invalid file
			//$("#uploadbutton").hide();
			//$("#fileInfoView").hide();
			//$("#fileName").html("");
			//$("#fileSize").html("");
		//};

            }

            if (n>-1) {
                $("#clearallbtn").button("enable");
            }
		}
	}

    function generateFileBoxHtml() {
        var validfile = "";
        if(validate_file(n)) {
            fdata[n].valid = true;
        } else {
            validfile = '<img style="float:left;padding-right:6px;" src="images/information.png" border=0 title="This file is invalid and will not be uploaded"/>';
        }

        var file_info = validfile + ' ' + fdata[n].filename + ' : ' + readablizebytes(fdata[n].fileSize);

        return '<div id="file_'+n+'" class="fileBox valid'+ fdata[n].valid+ '">' +
            '<span class="filebox_string" title="' + file_info + '">' + file_info + '</span>' +
            '<span class="delbtn" id="file_del_'+n+'" onclick="removeItem('+n+');">' +
            '<img src="images/delete.png" width="16" height="16" border="0" align="absmiddle" style="cursor:pointer"/>' +
            '</span>' +
            '<div class="progress_bar" id="progress_bar-'+ n + '"></div>' +
            '</div>';
    }

	function startupload()
	{
		// validate input data
		// validate file details to upload
		//$("#dialog-uploadprogress").dialog("option", "title", uploadprogress +  ":  " +  fdata[n].filename + " (" +readablizebytes(fdata[n].fileSize) + ")");
		
		// check if file is validated before uploading
	if(validate_file(n) && fdata[n].status) {
		$("#file_del_"+n).hide();
		fdata[n].bytesUploaded = 0;
		fdata[n].bytesTotal = fdata[n].fileSize;
		// validate form data and return filesize or validation error
		// load form into json array
		var query = $("#form1").serializeArray(), json = {};
		for (i in query) { json[query[i].name] = query[i].value; } 
		// add file information fields
		json["fileoriginalname"] = fdata[n].filename;
		json["filesize"] = parseInt(fdata[n].fileSize);
		json["vid"] = fdata[n].vid;
        json["filegroupid"] = fdata[n].filegroupid;
        json["filetrackingcode"] = fdata[n].filetrackingcode;
        json["fileto"] = $("#fileto").val();

        var firstFile = n == 0 ? '&firstfile=true' : '';

		$.ajax({
  		type: "POST",
  		url: "fs_multi_upload.php?type=validateupload&vid="+vid+"&n="+n+firstFile,
  		data: {myJson:  JSON.stringify(json)}
		}).success(function( data ) {
		if(data == "") {
		alert("No response from server");
		return;	
		}
		if(data == "ErrorAuth")
		{
			$("#dialog-autherror").dialog("open");
			return;			
		}
		var data = JSON.parse(data);
		
		if(data.errors)
		{
		$.each(data.errors, function(i,result){
		if(result == "err_token") {$("#dialog-tokenerror").dialog("open");} // token missing or error
		if(result == "err_notauthenticated") { $("#dialog-autherror").dialog("open");} // not authenticated
		if(result == "err_tomissing") { $("#fileto_msg").show();} // missing email data
		if(result == "err_expmissing") { $("#expiry_msg").show();} // missing expiry date
		if(result == "err_exoutofrange") { $("#expiry_msg").show();} // expiry date out of range
		if(result == "err_invalidemail") { $("#fileto_msg").show();} // 1 or more emails invalid
		if(result == "err_invalidfilename") { $("#file_msg").show();} // invalid filename
		if(result == "err_invalidextension") { $("#extension_msg").show();} //  invalid extension
		if(result == "err_nodiskspace") { errorDialog(errmsg_disk_space);} // not enough disk space on server
		})
		$("#uploadbutton a").attr("onclick", "validate()"); // re-activate upload button
		}
		if(data.status && data.status == "complete")
		{
		$("#fileToUpload").hide();// hide Browse
		$("#selectfile").hide();// hide Browse message
		$("#uploadbutton").hide(); // hide upload
		$("#cancelbutton").show(); // show cancel
		// show upload progress dialog
		//$("#dialog-uploadprogress").dialog("open");
		// no error so use result as current bytes uploaded for file resume 
		vid = data.vid;
		fdata[n].bytesUploaded = parseFloat(data.filesize);
            updatepb(fdata[n].bytesUploaded,fdata[n].bytesTotal, fdata[n].bytesUploaded);
            // validated so upload all files
		
		//if (typeof files !== "undefined") {
		//for (var i=0, l=files.length; i<l; i++) {
		//n = i;

            startTime = new Date().getTime();

            if(html5webworkers) {
                uploadFileWebworkers();
            } else { uploadFile(); }
		//}
		//}
		}
  		});
	} /*else {
			// check if more files need uploading
			if(n < fdata.length - 1)
			{
				n += 1;		
				startupload();
			} else {
			    // all files sent so complete
			    window.location.href="index.php?s=complete";
			}
	    }*/
	}


function openProgressBar(){
    $("#aggregate_dialog_contents").dialog({
        title: "Upload progress for tracking code: " + trackingCode,
        minWidth: 600,
        buttons: {
            'Pause': function() {
                //TODO
            },
            'Suspend': function() {
                //TODO
            },
            'Cancel Upload': function(){
                //TODO
            },
            'Close': function() {
                $(this).dialog('destroy');
            }

        }});
}

function doUploadComplete(){
    var end  = new Date().getTime();
    var time = end-startTime;
    var speed = fdata[n].bytesTotal / (time /1000) / 1024 / 1024 * 8;

    console.log('Upload time:'+ (time /1000) + 'sec');
    console.log('Speed: '+ speed.toFixed(2)+'Mbit/s' );

    var moreFiles = n < fdata.length - 1 ? '&morefiles=true' : '';

    var query = $("#form1").serializeArray(), json = {};
    $.ajax({
        type: "POST",
        url: "fs_multi_upload.php?type=uploadcomplete&vid="+vid+"&n="+n+moreFiles
        ,
        success:function( data ) {
            var data =  parseJSON(data);
            if(data.errors)
            {
                $.each(data.errors, function(i,result){
                    if(result == "err_token") {
                        $("#dialog-tokenerror").dialog("open");
                    } // token missing or error
                    if(result == "err_cannotrenamefile") {
                        window.location.href="index.php?s=uploaderror";
                        return;
                    } //
                    if(result == "err_emailnotsent") {
                        window.location.href="index.php?s=emailsenterror";
                        return;
                    } //
                    if(result == "err_filesizeincorrect") {
                        window.location.href="index.php?s=filesizeincorrect";
                    } //
                })
            } else if (n < fdata.length-1) {
                n+=1;
                startupload();
            } else {
                window.location.href="index.php?s=complete";
            }
        }, error:function(xhr,err){
            // error function to display error message e.g.404 page not found
            ajaxerror(xhr.readyState,xhr.status,xhr.responseText);
        }
    });
}

function getFiles() {
    var files = [];

    for (var i = n; i < fdata.length; i++) {
        files.push(fdata[i].file);
    }

    return files;
}

function uploadFileWebworkers() {
    var files = getFiles();

    //var files = document.getElementById("fileToUpload").files;
    var path = document.location.pathname;
    var dir = path.substring(0, path.lastIndexOf('/'));

    $("head").append('<script type="text/javascript" src="lib/tsunami/js/tsunami.js"></script>');

    if(fdata[n].bytesUploaded > fdata[n].bytesTotal -1 ) {
        doUploadComplete();
        return;
    }

    chunksize = parseInt($('#chunksize').val())*1024*1024;
    console.log('Chunksize: '+ chunksize);

    workerCount = parseInt($('#workerCount').val());

    console.log('Using '+ workerCount+' worker(s)');
    jobsPerWorker = parseInt($('#jobsPerWorker').val());
    console.log('Setting '+ jobsPerWorker+' job(s) per worker');

    var tsunami = new Tsunami({
        uri: dir + '/' +uploadURI + "?type=tsunami&vid="+vid+"&n="+n,
        simultaneousUploads: workerCount,
        jobsPerWorker: jobsPerWorker,
        chunkSize: chunksize,
        workerFile: 'lib/tsunami/js/tsunami_worker.js',
        log: false,
        onComplete: doUploadComplete,
        onProgress: updatepb
    });
    tsunami.addFiles(files);
    tsunami.upload();
}

function uploadFile() {
		
		// move to next chunk
		var file = fdata[n].file;
		var txferSize = chunksize;

		if(fdata[n].bytesUploaded > fdata[n].bytesTotal -1 )
			{
			// COMPLETE THIS ONE
			var query = $("#form1").serializeArray(), json = {};
					$.ajax({
  					type: "POST",
  					url: "fs_multi_upload.php?type=uploadcomplete&vid="+vid+"&n="+n+"&rtnemail="+$("#rtnemail").prop('checked')
					}).success(function( data ) {
					if(data == "err_cannotrenamefile")
					{
						window.location.href="index.php?s=uploaderror";
						return;
					} else if(data == "err_filesizeincorrect")
					{
						window.location.href="index.php?s=filesizeincorrect";
						return;
					}
					// IF MORE FILES NEED UPLOADING THEN
			if(	n < fdata.length-1 )
			{
				n += 1;
					startupload();
					return;
				}  else
				{
					window.location.href="index.php?s=complete";
				}
				return;
			});
			return;

				// all uploaded so return
		//if(data == "complete"){

		//} else {
		//window.location.href="index.php?s=completev";
		//}
		}

		if(fdata[n].bytesUploaded + txferSize > fdata[n].fileSize)
		{
		txferSize = fdata[n].fileSize - fdata[n].bytesUploaded;
		}
		// check if firefox or Chrome slice supported

		if(file && file.webkitSlice )
		{
			var blob = file.webkitSlice(fdata[n].bytesUploaded, txferSize+fdata[n].bytesUploaded);
		} else
		if(file && file.mozSlice )
		{
			var blob = file.mozSlice(fdata[n].bytesUploaded, txferSize+fdata[n].bytesUploaded);
		} else
		//if(file && file.slice )
		{
			var blob = file.slice(fdata[n].bytesUploaded, txferSize+fdata[n].bytesUploaded);
		}
	
	var boundary = "fileboundary"; //Boundary name
	var uri = (uploadURI + "?type=chunk&vid="+vid+ "&n="+n); //Path to script for handling the file sent
	var xhr = new XMLHttpRequest(); //Create the object to handle async requests
	xhr.onreadystatechange = processReqChange;
	xhr.upload.addEventListener("progress", uploadProgress, false);
	xhr.open("POST", uri, true); //Open a request to the web address set
	xhr.setRequestHeader("Content-Disposition"," attachment; name='fileToUpload'"); 
	xhr.setRequestHeader("Content-Type", "application/octet-stream");
	xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    //Set up the body of the POST data includes the name & file data.
	xhr.send(blob);

	function processReqChange(){
		 if (xhr.readyState == 4) {
	    	if (xhr.status == 200) {
				if(xhr.responseText == "ErrorAuth")
				{
					$("#dialog-autherror").dialog("open");
					return;			
				}
			fdata[n].bytesUploaded = parseFloat(xhr.responseText);
			updatepb(fdata[n].bytesUploaded,fdata[n].bytesTotal, 0);
			uploadFile();
			} else {
			errorDialog("There was a problem retrieving the data:\n" + req.statusText);
			}
		}else{
		}
}

return true;
}

function updateTransferSpeed() {
	var currentBytes = bytesUploaded+(chunksize*(chunk_id -1));
	var bytesDiff = currentBytes - chunksize*(chunk_id -1);//previousBytesLoaded;
    if (bytesDiff == 0) return;
    previousBytesLoaded = currentBytes;
    bytesDiff = bytesDiff * 2;
    var bytesRemaining = bytesTotal - previousBytesLoaded;
    var secondsRemaining = bytesRemaining / bytesDiff;
    var speed = "";
    if (bytesDiff > 1024 * 1024)
		speed = (Math.round(bytesDiff * 100/(1024*1024))/100).toString() + "MBps";
    	else if (bytesDiff > 1024)
    	speed =  (Math.round(bytesDiff * 100/1024)/100).toString() + "kBps";
     	else
        speed = bytesDiff.toString() + 'Bps';
       $("#transferSpeedInfo").html(speed);
}

function secondsToString(seconds) {        
        var h = Math.floor(seconds / 3600);
        var m = Math.floor(seconds % 3600 / 60);
        var s = Math.floor(seconds % 3600 % 60);
        return ((h > 0 ? h + ":" : "") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + ":" : "0:") + (s < 10 ? "0" : "") + s);
}

// update the progress bar (Also used for aggregate progress bar)
function updatepb(bytesloaded,totalbytes, amountUploaded)
{
	//$("#progress_bar").show();
	var percentComplete = Math.round(bytesloaded * 100 / totalbytes);
	var bytesTransfered = '';
	if (bytesloaded > 1024*1024)
		bytesTransfered = (Math.round(bytesloaded * 100/(1024*1024))/100).toString() + 'MB';
	else if (bytesloaded > 1024)
		bytesTransfered = (Math.round(bytesloaded * 100/1024)/100).toString() + 'kB';
	else
		bytesTransfered = (Math.round(bytesloaded * 100)/100).toString() + 'Bytes';
		var progress_bar = '#progress_bar-'+n;
		var file_box = '#file_'+n;
		var progress_completed = '#progress_completed-'+n;
		//$(fileref).width(percentComplete/100 *$(filebarref).width());	//set width of progress bar based on the $status value (set at the top of this page)
		//$(fileref).html(percentComplete +"% ");
		$(progress_bar).width(percentComplete/100 *$(file_box).width());	//set width of progress bar based on the $status value (set at the top of this page)
		//$(progress_completed).html(parseInt(percentComplete) + "%(" + bytesTransfered + ")" );	//display the % completed within the progress bar



    // use time elapsed from start to calculate averages
    var now = new Date().getTime();

    // get the result in seconds
    var timeSinceStart = (now - aggregateStartTime)/1000;
    // Adds the amount of data uploaded this call to the total (for all files)
    totalBytesLoaded += amountUploaded;

    // get the result in MB to make it easier to calculate the time remaining
    var uploadSpeed = (totalBytesLoaded/timeSinceStart)/1024/1024;
    var bytesRemaining = totalFileLengths-totalBytesLoaded;

    // Check for uploadSpeed 0 to avoid 'Infinity' caused by /0.
    var timeRemaining = (uploadSpeed ==0 ? 0 : ((bytesRemaining/1024/1024) / uploadSpeed));

    // Calculates the new length of the progress bar based on the total bytes uploaded
    percentageComplete = Math.round(totalBytesLoaded*100 / totalFileLengths);

    // Updates the html contents of the <p> tags in generateAggregateProgressBar
    $('#aggregate_string').html(percentageComplete + '%');
    $('#totalUploaded').html("Total uploaded: " + readablizebytes(totalBytesLoaded) + "/" + readablizebytes(totalFileLengths));

    // x8 to gives the upload speed in Mbits rather than MBytes
    $('#averageUploadSpeed').html("Average upload Speed:" + uploadSpeed.toFixed(2)*8 + "MBit/s");
    $('#timeRemaining').html("Approx time remaining: " + secondsToString(timeRemaining));
    $('#aggregate_bar').width(percentageComplete/100 *$('#aggregate_progress').width());
	  
}

function uploadProgress(evt) {
	}

function uploadFailed(evt)
{
	clearInterval(intervalTimer);
	errorDialog("An error occurred while uploading the file.");  
}  
  
function uploadCanceled(evt)
{
	clearInterval(intervalTimer);
	erorDialog("The upload has been canceled by the user or the browser dropped the connection.");  
}

// remove file from upload array
function removeItem(fileID)
{
    // Updates the combined file lengths
    totalFileLengths -= fdata[fileID].fileSize;
	$("#file_"+fileID).remove();
    fdata[fileID] = [];
    fdata[fileID].status = false;
	//fdata.splice(fileID, 1);
	n = n - 1;
    if (n < 0) {
        $("#aggregate_progress").hide();
        $("#fileToUpload").val(""); // Needed to allow reselection of files.
        $("#draganddropmsg").show();
        $("#clearallbtn").button("disable");
    }
}

// clears the contents of the files-to-upload
function clearFileBox() {
    var temp = fdata.length;
    for (var i = 0; i < temp; i++){
        removeItem(i);
    }
}
