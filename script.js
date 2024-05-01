function toggleButtons() 
        {
            var fileInput = document.getElementById('file');
            var whisperTopSharersBtn = document.getElementById('whisperTopSharersBtn');
            var whisperTopCommentersBtn = document.getElementById('whisperTopCommentersBtn');

            if (fileInput.files && fileInput.files.length > 0) 
            {
                whisperTopSharersBtn.disabled = false;
                whisperTopCommentersBtn.disabled = false;
            } 
            else 
            {
                whisperTopSharersBtn.disabled = true;
                whisperTopCommentersBtn.disabled = true;
                clearResults();
            }
        }

        function clearResults() 
        {
            var resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '';
        }

        function whisperTopSharers() 
        {
            exportToExcel("shared your post", "My Top Sharers");
        }

        function whisperTopCommenters() 
        {
            exportToExcel("commented", "My Top Commenters");
        }

        function exportToExcel(keyword, worksheetName) 
        {
            var fileInput = document.getElementById('file');
            var resultDiv = document.getElementById('result');

            if (!fileInput.files || fileInput.files.length === 0) 
            {
                resultDiv.innerHTML = '<p>Please select a file.</p>';
                return;
            }

            var file = fileInput.files[0];
            var reader = new FileReader();

            reader.onload = function(event) 
            {
                var content = event.target.result.toLowerCase();
                var pattern = new RegExp('([^\n]+?)\\s' + escapeRegExp(keyword), 'g');
                var matches = content.matchAll(pattern);
                var engagementCount = {};

                for (var match of matches) 
                {
                    var username = match[1].trim();
                    engagementCount[username] = (engagementCount[username] || 0) + 1;
                }

                var sortedEngagementCount = Object.entries(engagementCount)
                    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

                var data = [["Rank", "Username", "Frequency"]];

                var rank = 0;
                var previousCount = -1;
                var previousRank = 0;

                sortedEngagementCount.forEach(function(entry, index) 
                {
                    var username = entry[0];
                    var count = entry[1];
                    if (count !== previousCount) 
                    {
                        rank = previousRank + 1;
                    }
                    data.push([rank, username, count]);
                    previousCount = count;
                    previousRank = rank;
                });

                exportToExcelData(data, keyword, worksheetName);
            };

            reader.readAsText(file);
        }

        function exportToExcelData(data, keyword, worksheetName) 
        {
            //Add an empty row after the title
            var titleWithTotal = [worksheetName + ": " + (data.length - 1)];
            data.unshift(titleWithTotal);
            data.splice(1, 0, []); //Insert an empty row at index 1

            var ws = XLSX.utils.aoa_to_sheet(data);

            //Format the title cell (A1) with bold and font size 20
            var titleCellStyle = { font: { bold: true, sz: 20 } };
            ws['A1'].s = titleCellStyle;

            var wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, worksheetName);
            var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });

            function s2ab(s) 
            {
                var buf = new ArrayBuffer(s.length);
                var view = new Uint8Array(buf);
                for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
                return buf;
            }

            var fileName = worksheetName + ".xlsx";
            saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), fileName);

            //Display the results in the browser
            var resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '<h2>Results</h2>' +
                '<p>' + titleWithTotal[0] + '</p>';

            //Concatenate result entries into a single string with the specified format
            var resultEntries = '';
            for (var i = 1; i < data.length; i++) 
            {
                var rank = data[i][0];
                var username = data[i][1];
                var frequency = data[i][2];

                //Exclude lines with undefined values
                if (rank !== undefined && username !== undefined && frequency !== undefined) 
                {
                    //Exclude the line "Rank. Username: Frequency times"
                    if (rank !== "Rank" && username !== "Username" && frequency !== "Frequency") 
                    {
                        resultEntries += rank + '. <strong>' + username + '</strong> ' + keyword + ': ' + frequency + (frequency == 1 ? ' time<br>' : ' times<br>');
                    }
                }
            }

            //Set the inner HTML of resultDiv with concatenated result entries
            resultDiv.innerHTML += resultEntries;
        }

        //Function to escape special characters in regular expression
        function escapeRegExp(string) 
        {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
