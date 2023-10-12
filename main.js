function displayTeacherFiles() {
    const storageRef = firebase.storage().ref();
    const teacherFolderRef = storageRef.child('teacher-uploads');

    teacherFolderRef.listAll()
        .then((res) => {
            const fileListContainer = document.getElementById("file-list");
            fileListContainer.innerHTML = '<h2>Teacher Files:</h2>';

            res.items.forEach((item) => {
                // Create a div to hold the file information
                const fileDiv = document.createElement("div");

                // Create a download link for the file
                const fileLink = document.createElement("a");
                fileLink.href = "#"; // Set the href attribute to "#" for now
                fileLink.innerText = item.name;
                fileLink.onclick = () => downloadFile(item);

                // Create a "View" button for the file
                const viewButton = document.createElement("button");
                viewButton.textContent = "View";
                viewButton.onclick = () => viewFile(item);

                // Create a "Delete" button for the file
                const deleteButton = document.createElement("button");
                deleteButton.textContent = "Delete";
                deleteButton.onclick = () => deleteFile(item);

                // Append the file link, view button, and delete button to the fileDiv
                fileDiv.appendChild(fileLink);
                fileDiv.appendChild(viewButton);
                fileDiv.appendChild(deleteButton);

                // Append the fileDiv to the fileListContainer
                fileListContainer.appendChild(fileDiv);
                fileListContainer.appendChild(document.createElement("br"));
            });

            // Add the Sign Out button at the end
            const signOutButton = document.createElement("button");
            signOutButton.textContent = "Sign Out";
            signOutButton.onclick = signOut;
            fileListContainer.appendChild(signOutButton);
        })
        .catch((error) => {
            console.error("Error displaying teacher files: " + error);
        });
}



function deleteFile(fileRef) {
    fileRef.delete()
        .then(() => {
            alert("File deleted successfully.");
            // Refresh the file list to reflect the changes
            displayTeacherFiles();
        })
        .catch((error) => {
            console.error("Error deleting the file: " + error);
        });
}

function viewFile(fileRef) {
    fileRef.getDownloadURL()
        .then((url) => {
            // Open the file in a new tab or download it
            window.open(url, '_blank');
        })
        .catch((error) => {
            console.error("Error viewing the file: " + error);
        });
}



// Function to download a file from Firebase Storage
function downloadFile(fileRef) {
    fileRef.getDownloadURL()
        .then((url) => {
            // Create a temporary link and trigger the download
            const link = document.createElement("a");
            link.href = url;
            link.download = fileRef.name;
            link.click();
        })
        .catch((error) => {
            console.error("Error downloading the file: " + error);
        });
}


// Function to upload a file to Firebase Storage
function uploadFile() {
    const fileInput = document.getElementById("file-input");
    const file = fileInput.files[0];

    if (file) {
        // Define allowed file types and maximum file size (2 MB)
        const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
        const maxSize = 2 * 1024 * 1024; // 2 MB

        if (allowedTypes.includes(file.type) && file.size <= maxSize) {
            // The file is valid, proceed with the upload
            const storageRef = firebase.storage().ref();
            const uploadTask = storageRef.child('teacher-uploads/' + file.name).put(file);

            uploadTask.on('state_changed', function (snapshot) {
                // Track upload progress if needed
            }, function (error) {
                console.error("Upload failed: " + error);
            }, function () {
                // Upload completed successfully
                alert("File uploaded successfully.");
            });
        } else {
            // The file does not meet the criteria, show an error message in a popup
            alert("Invalid file. Please upload a PDF, DOC, or DOCX file that is 2 MB or less in size.");
        }
    } else {
        // No file selected
        alert("Please select a file to upload.");
    }
}



// Function to sign up a new user
function signUp() {
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const role = document.getElementById("user-role").value;

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Sign-up successful
            const user = userCredential.user;

            // Store user role in the database
            firebase.database().ref('users/' + user.uid).set({
                role: role
            });

            alert("Sign-up successful. You are now a " + role);

            // Check the user's role and show the upload section for teachers
            if (role === "teacher") {
                showFileUploadForm();
            } else if (role === "admin") {
                displayTeacherFiles();
            }
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            alert("Sign-up failed: " + errorMessage);
        });
}

// Function to log in a user
function login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            alert("Login successful.");
            const user = userCredential.user;

            // Check the user's role and show the upload section for teachers
            firebase.database().ref('users/' + user.uid).once('value').then(function (snapshot) {
                const role = snapshot.val().role;
                if (role === "teacher") {
                    showFileUploadForm();
                } else if (role === "admin") {
                    displayTeacherFiles();
                }
            });
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            alert("Login failed: " + errorMessage);
        });
}

// Function to check if a user is signed in
function isUserSignedIn() {
    return firebase.auth().currentUser !== null;
}

// Function to show the file upload form
function showFileUploadForm() {
    const fileUploadForm = `
        <br><br>
        <h1>File Upload for Teachers</h1>
        <br><br>
        <input type="file" id="file-input">
        <button onclick="uploadFile()">Upload File</button>
        ${isUserSignedIn() ? '<button onclick="signOut()">Sign Out</button>' : ''}
    `;
    document.body.innerHTML = fileUploadForm;
}



// Function to sign out the current user and reload the page
function signOut() {
    firebase.auth().signOut()
        .then(() => {
            alert("Sign-out successful.");
            location.reload(); // Reload the page
        })
        .catch((error) => {
            console.error("Sign-out failed: " + error);
        });
}


