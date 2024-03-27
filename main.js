

// Function to display the login section
function showLoginSection() {
    document.getElementById("login-page").style.display = "block";
    document.getElementById("file-upload-section").style.display = "none";
    document.getElementById("admin-section").style.display = "none";
}

// Function to display the File Upload section for teachers
function showFileUploadSection() {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("file-upload-section").style.display = "block";
    document.getElementById("admin-section").style.display = "none";
}

// Function to display the Admin Page to Display Teacher Files
function showAdminSection() {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("file-upload-section").style.display = "none";
    document.getElementById("admin-section").style.display = "block";
}


// Function to upload a PDF file to Firebase Storage
function uploadFile() {
    const fileInput = document.getElementById("file-input");
    const file = fileInput.files[0];
    if (file) {
        // Check file size and type
        if (file.size > 2 * 1024 * 1024) {
            toastr.error("File size must be less than 2 MB.");
            return;
        }
        if (file.type !== "application/pdf") {
            toastr.error("Only PDF files are allowed.");
            return;
        }

        const user = firebase.auth().currentUser;
        if (user) {
            const userId = user.uid;
            const storageRef = firebase.storage().ref();
            const teacherFolderRef = storageRef.child(`teacher-uploads/${userId}/${file.name}`);

            const uploadTask = teacherFolderRef.put(file);

            // Show the loading icon
            const loadingIcon = document.getElementById("loading-icon");
            loadingIcon.style.display = "block";
            toastr.info("Uploading...");

            uploadTask.then(snapshot => {
                // Upload completed successfully
                toastr.success("PDF file uploaded successfully.");

                startCountdown(); // Start the countdown after a successful file upload

                // Hide the loading icon
                loadingIcon.style.display = "none";

                // Generate a download link using a download token
                snapshot.ref
                    .getDownloadURL()
                    .then(downloadURL => {
                        // Automatically encrypt the download link
                        const encryptionKey = "YourSecretKey"; // Replace with your secret key
                        const encryptedLink = CryptoJS.AES.encrypt(downloadURL, encryptionKey).toString();

                        // Display the encrypted download link
                        const encryptedLinkField = document.getElementById("download-link");
                        encryptedLinkField.value = encryptedLink;

                        // Show the download link container
                        const downloadLinkContainer = document.getElementById("download-link-container");
                        downloadLinkContainer.style.display = "block";

                        // // Automatically download the encrypted link to local storage as a text file
                        // const blob = new Blob([encryptedLink], { type: "text/plain" });
                        // const a = document.createElement("a");
                        // a.href = URL.createObjectURL(blob);
                        // a.download = "encrypted-link.txt";
                        // a.style.display = "none";
                        // document.body.appendChild(a);
                        // a.click();
                        // document.body.removeChild(a);
                    })
                    .catch(error => {
                        console.error("Error generating download link: " + error);
                    });
            }).catch(error => {
                console.error("Upload failed: " + error);
                // Hide the loading icon in case of an error
                loadingIcon.style.display = "none";
            });
        }
    }
}



// // Function to encrypt the download link
// function encryptDownloadLink() {
//     const downloadLink = document.getElementById("download-link").value;
//     const encryptionKey = "YourSecretKey"; // Replace with your secret key

//     if (downloadLink && encryptionKey) {
//         const encryptedLink = CryptoJS.AES.encrypt(downloadLink, encryptionKey).toString();
//         const encryptedLinkField = document.getElementById("encrypted-link");
//         encryptedLinkField.value = encryptedLink;

//         // Show the encrypted link container
//         const encryptedLinkContainer = document.getElementById("encrypted-link-container");
//         encryptedLinkContainer.style.display = "block";
//     } else {
//         alert("Please provide a download link and encryption key.");
//     }
// }

// // Function to decrypt the encrypted download link
// function decryptDownloadLink() {
//     const encryptedLink = document.getElementById("encrypted-link").value;
//     const encryptionKey = "YourSecretKey"; // Replace with your secret key

//     if (encryptedLink && encryptionKey) {
//         const decryptedLink = CryptoJS.AES.decrypt(encryptedLink, encryptionKey).toString(CryptoJS.enc.Utf8);
//         const downloadLink = document.getElementById("download-link");
//         downloadLink.value = decryptedLink;

//         // Show the download link container
//         const downloadLinkContainer = document.getElementById("download-link-container");
//         downloadLinkContainer.style.display = "block";
//     } else {
//         alert("Please provide an encrypted download link and encryption key.");
//     }
// }


// Function to copy the download link to the clipboard
function copyDownloadLink() {
    const downloadLink = document.getElementById("download-link");
    downloadLink.select();
    document.execCommand("copy");
    toastr.success("Download link copied to clipboard!");
}




// Function to log in a user
function login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            toastr.success("Login sucess.");
            const user = userCredential.user;

            // Check the user's role and show the upload section for teachers
            firebase.database().ref('users/' + user.uid).once('value').then(function(snapshot) {
                const role = snapshot.val().role;
                if (role === "teacher") {
                    showFileUploadSection(); // Show the upload form for teachers
                } else if (role === "admin") {
                    // Handle admin login or other actions
                    displayTeacherFiles();
                    showAdminSection();
                }
            });
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            // alert("Login failed: " + errorMessage);
            toastr.error("Login Failed");
        });
}


// // Function to sign out the current user and reload the page
// function signOut() {
//     firebase.auth().signOut()
//         .then(() => {
//             showLoginSection();
//             toastr.error("Sign-out successful.");
//         })
//         .catch((error) => {
//             console.error("Sign-out failed: " + error);
//         });
// }

// Function to display files uploaded by all teachers in the admin page
function displayTeacherFiles() {
    const storageRef = firebase.storage().ref();
    const teacherFolderRef = storageRef.child('teacher-uploads');

    teacherFolderRef.listAll()
        .then((teachers) => {
            const fileListContainer = document.getElementById("file-list");
            fileListContainer.innerHTML = '<button onclick="signOut();">Sign Out</button><br><br><h2>Teacher Files:</h2>';

            teachers.prefixes.forEach((teacher) => {
                const teacherName = teacher.name;

                // Create a button for each teacher
                const teacherButton = document.createElement("button");
                teacherButton.innerText = teacherName;
                teacherButton.onclick = () => openTeacherFolder(teacherName);
                fileListContainer.appendChild(teacherButton);
            });
        })
        .catch((error) => {
            console.error("Error displaying teacher folders: " + error);
        });
}

// Function to open a teacher's folder and display their files
function openTeacherFolder(teacherName) {
    const storageRef = firebase.storage().ref();
    const teacherFolderRef = storageRef.child(`teacher-uploads/${teacherName}`);

    teacherFolderRef.listAll()
        .then((res) => {
            const fileListContainer = document.getElementById("file-list");

            // Clear the previous file list
            fileListContainer.innerHTML = `<button onclick="goBack();">Back</button><br><br><h2>Files for ${teacherName}:</h2>`;

            res.items.forEach((item) => {
                // Create a download link for each file
                const fileLink = document.createElement("a");
                fileLink.href = "#"; // Set the href attribute to "#" for now
                fileLink.innerText = item.name;
                fileLink.onclick = () => viewFile(item); // Add click event to view the file
                fileListContainer.appendChild(fileLink);
                fileListContainer.appendChild(document.createElement("br"));
            });
        })
        .catch((error) => {
            console.error(`Error displaying files for ${teacherName}: ` + error);
        });
}

// Function to go back to the list of teachers
function goBack() {
    displayTeacherFiles(); // Redisplay the list of teachers
}


// Function to view a file in a new tab
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

// Function to check if a user is signed in
function isUserSignedIn() {
    return firebase.auth().currentUser !== null;
}


// Function to sign out the current user and reload the page
function signOut() {
    firebase.auth().signOut()
        .then(() => {
            toastr.error("Sign-out successful.");
            location.reload(); // Reload the page
        })
        .catch((error) => {
            console.error("Sign-out failed: " + error);
        });
}

// Function to show the registration form
function showRegistrationForm() {
    const registrationForm = document.getElementById("registration-form");
    registrationForm.style.display = "block";
}

// Function to show the registration form
function hideRegistrationForm() {
    const registrationForm = document.getElementById("registration-form");
    registrationForm.style.display = "none";
}

// Function to register a new user
function registerUser() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const subject = document.getElementById("subject").value;
    const role = document.getElementById("role").value;
    const password = document.getElementById("password").value;

    // Perform user registration here, e.g., using Firebase Authentication and Realtime Database
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            // Store user details in the Realtime Database
            firebase.database().ref('users/' + user.uid).set({
                name: name,
                email: email,
                subject: subject,
                role: role,
            });
            toastr.success("User registered successfully.");
            hideRegistrationForm();
        })
        .catch((error) => {
            const errorMessage = error.message;
            toastr.error("User registration failed: " + errorMessage);
        });
}

// Function to view or download files uploaded by the current teacher
function viewOwnFiles() {
    const user = firebase.auth().currentUser;
    const userId = user.uid;

    const storageRef = firebase.storage().ref();
    const teacherFolderRef = storageRef.child(`teacher-uploads/${userId}`);

    teacherFolderRef.listAll()
        .then((res) => {
            const fileListContainer = document.getElementById("file-listt");
            fileListContainer.innerHTML = '<br><h2>Your Files:</h2>';

            res.items.forEach((item) => {
                // Create a download link for each file
                const fileLink = document.createElement("a");
                fileLink.href = "#"; // Set the href attribute to "#" for now
                fileLink.innerText = item.name;
                fileLink.onclick = () => downloadFile(item); // Add click event to download the file
                fileListContainer.appendChild(fileLink);
                fileListContainer.appendChild(document.createElement("br"));
            });
        })
        .catch((error) => {
            console.error("Error displaying teacher files: " + error);
        });
}

function openWin() {
    window.open("encrypt.html");
}

// Function to send email with the encrypted link
function sendEmail() {
 
    const encryptedLink = document.getElementById("download-link").value;

    // Check if the encrypted link is available
    if (encryptedLink) {
        const subject = "Encrypted Link Generated";
        const emailBody = `Check out this encrypted link: ${encryptedLink}`;

        // Create a mailto URL with the subject and body
        const mailtoURL = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

        // Open the default email app with the mailto URL
        window.location.href = mailtoURL;

        // Inform the user that the email has been sent
        toastr.info("Opening Email...");
    } else {
        toastr.error("Please generate the encrypted link first.");
    }
}

let countdown;
// Function to start the countdown
function startCountdown() {
    countdown = 30; // Set the initial countdown value to 60 seconds

    const countdownContainer = document.getElementById("countdown-container");
    const countdownValueElement = document.getElementById("countdown-value");

    countdownContainer.style.display = "block"; // Show the countdown container

    const countdownInterval = setInterval(() => {
        // Update the countdown value and display it
        countdown--;
        countdownValueElement.textContent = countdown;

        if (countdown <= 0) {
            clearInterval(countdownInterval); // Stop the countdown when it reaches zero
            // Refresh the page
            toastr.error("Time Expired. Refreshing the page.");
            location.reload();
        }
    }, 1000); // Update the countdown every second
}




// Add this JavaScript function
function togglePasswordVisibility() {
    const passwordInput = document.getElementById("login-password");
    const eyeIcon = document.getElementById("eye-icon");

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        eyeIcon.classList.remove("fa-eye");
        eyeIcon.classList.add("fa-eye-slash");
    } else {
        passwordInput.type = "password";
        eyeIcon.classList.remove("fa-eye-slash");
        eyeIcon.classList.add("fa-eye");
    }
}
