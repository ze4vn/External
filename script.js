import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBqy50MNHKdMYF6L0MtJiccHpXXYwU9CgM",
    authDomain: "external-17739.firebaseapp.com",
    projectId: "external-17739",
    messagingSenderId: "584942543170",
    appId: "1:584942543170:web:4536fc1f449988dd3328db",
    measurementId: "G-HD537F5ZY9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const authScreen = document.getElementById("AuthScreen");
const authTitle = document.getElementById("AuthTitle");
const emailInput = document.getElementById("Email");
const usernameInput = document.getElementById("Username");
const usernameWrapper = document.getElementById("UsernameWrapper");
const password = document.getElementById("Password");
const passwordToggle = document.getElementById("PasswordToggle");
const submitAuth = document.getElementById("SubmitAuth");
const authSwitchText = document.getElementById("AuthSwitchText");
const authSwitchButton = document.getElementById("AuthSwitchButton");
const authMessage = document.getElementById("AuthMessage");

const userLabel = document.getElementById("UserLabel");
const logoutButton = document.getElementById("LogoutButton");

const pageTitles = {
    executor: "Executor Scripts",
    html: "HTML",
    python: "Python",
    luau: "LuaU"
};

const pageTitle = document.getElementById("PageTitle");
const searchbar = document.getElementById("Searchbar");
const navButtons = document.querySelectorAll(".NavButton");
const projectGrid = document.getElementById("ProjectGrid");

const addButton = document.getElementById("AddButton");
const addModal = document.getElementById("AddModal");
const closeModal = document.getElementById("CloseModal");
const cancelAdd = document.getElementById("CancelAdd");
const publishScript = document.getElementById("PublishScript");
const scriptLanguage = document.getElementById("ScriptLanguage");
const scriptTitle = document.getElementById("ScriptTitle");
const scriptDescription = document.getElementById("ScriptDescription");
const scriptCode = document.getElementById("ScriptCode");
const addMessage = document.getElementById("AddMessage");

const detailView = document.getElementById("DetailView");
const backButton = document.getElementById("BackButton");
const detailTitle = document.getElementById("DetailTitle");
const detailCreator = document.getElementById("DetailCreator");
const detailDescription = document.getElementById("DetailDescription");
const detailCode = document.getElementById("DetailCode");
const copyCodeButton = document.getElementById("CopyCodeButton");
const commentsList = document.getElementById("CommentsList");
const commentInput = document.getElementById("CommentInput");
const postCommentButton = document.getElementById("PostCommentButton");

let currentPage = "executor";
let currentUser = null;
let authMode = "login";
let projectsUnsubscribe = null;
let commentsUnsubscribe = null;
let currentProjects = [];
let activeProject = null;

function withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), ms)
        )
    ]);
}

function setAuthMode(mode) {
    authMode = mode;
    authMessage.textContent = "";
    if (mode === "register") {
        authTitle.textContent = "Register";
        submitAuth.textContent = "Register";
        usernameWrapper.classList.add("show");
        authSwitchText.textContent = "Already have an account?";
        authSwitchButton.textContent = "Login";
        password.setAttribute("autocomplete", "new-password");
    } else {
        authTitle.textContent = "Login";
        submitAuth.textContent = "Login";
        usernameWrapper.classList.remove("show");
        usernameInput.value = "";
        authSwitchText.textContent = "Don't have an account?";
        authSwitchButton.textContent = "Register";
        password.setAttribute("autocomplete", "current-password");
    }
}

function openAuth() {
    authScreen.style.display = "flex";
    authScreen.classList.remove("hide");
}

function closeAuth() {
    authScreen.classList.add("hide");
    setTimeout(() => {
        authScreen.style.display = "none";
    }, 500);
}

function friendlyAuthError(code) {
    switch (code) {
        case "auth/invalid-email": return "That email doesn't look right.";
        case "auth/user-not-found": return "No account with that email.";
        case "auth/wrong-password":
        case "auth/invalid-credential": return "Wrong email or password.";
        case "auth/email-already-in-use": return "That email is already registered.";
        case "auth/weak-password": return "Password must be at least 6 characters.";
        case "auth/too-many-requests": return "Too many attempts. Try again later.";
        case "auth/network-request-failed": return "Network error. Check your connection.";
        default: return "Something went wrong. Try again.";
    }
}

passwordToggle.addEventListener("click", () => {
    const showing = password.type === "text";
    password.type = showing ? "password" : "text";
    passwordToggle.setAttribute("aria-label", showing ? "Show password" : "Hide password");
});

authSwitchButton.addEventListener("click", () => {
    setAuthMode(authMode === "login" ? "register" : "login");
});

submitAuth.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const pass = password.value;
    const username = usernameInput.value.trim();

    authMessage.textContent = "";

    if (!email) {
        authMessage.textContent = "Enter your email.";
        return;
    }
    if (!pass || pass.length < 6) {
        authMessage.textContent = "Password must be at least 6 characters.";
        return;
    }

    submitAuth.disabled = true;
    const originalText = submitAuth.textContent;
    submitAuth.textContent = "Please wait...";

    try {
        if (authMode === "register") {
            if (username.length < 3 || username.length > 24) {
                throw { code: "custom/username" };
            }
            if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
                throw { code: "custom/username-chars" };
            }
            const cred = await createUserWithEmailAndPassword(auth, email, pass);
            await updateProfile(cred.user, { displayName: username });
            await setDoc(doc(db, "users", cred.user.uid), {
                username: username,
                createdAt: serverTimestamp()
            });
        } else {
            await signInWithEmailAndPassword(auth, email, pass);
        }
        emailInput.value = "";
        password.value = "";
        usernameInput.value = "";
    } catch (err) {
        if (err.code === "custom/username") {
            authMessage.textContent = "Username must be 3-24 characters.";
        } else if (err.code === "custom/username-chars") {
            authMessage.textContent = "Username: letters, numbers, _ . - only.";
        } else {
            authMessage.textContent = friendlyAuthError(err.code);
        }
    } finally {
        submitAuth.disabled = false;
        submitAuth.textContent = originalText;
    }
});

logoutButton.addEventListener("click", () => {
    signOut(auth);
});

function displayProjects() {
    projectGrid.innerHTML = "";
    const q = searchbar.value.trim().toLowerCase();
    const filtered = currentProjects.filter(p => {
        if (!q) return true;
        return (p.title || "").toLowerCase().includes(q) ||
               (p.description || "").toLowerCase().includes(q);
    });

    if (filtered.length === 0) {
        const empty = document.createElement("p");
        empty.className = "EmptyState";
        empty.textContent = q ? "No scripts match your search." : "No scripts yet. Click + to add one.";
        projectGrid.appendChild(empty);
        return;
    }

    filtered.forEach(project => {
        const card = document.createElement("div");
        card.className = "ProjectCard";

        const header = document.createElement("div");
        header.className = "ProjectHeader";

        const title = document.createElement("h3");
        title.className = "ProjectTitle";
        title.textContent = project.title || "Untitled";

        const badge = document.createElement("span");
        badge.className = "ProjectBadge";
        badge.textContent = project.language || currentPage;

        header.appendChild(title);
        header.appendChild(badge);

        const desc = document.createElement("p");
        desc.className = "ProjectDescription";
        desc.textContent = project.description || "No description.";

        const meta = document.createElement("div");
        meta.className = "ProjectMeta";
        meta.textContent = project.authorName ? "by " + project.authorName : "";

        card.appendChild(header);
        card.appendChild(desc);
        card.appendChild(meta);

        card.addEventListener("click", () => openDetail(project.id));

        projectGrid.appendChild(card);
    });
}

function subscribeToProjects(language) {
    if (projectsUnsubscribe) {
        projectsUnsubscribe();
        projectsUnsubscribe = null;
    }

    const q = query(
        collection(db, "projects"),
        where("language", "==", language)
    );

    projectsUnsubscribe = onSnapshot(q, (snapshot) => {
        currentProjects = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        currentProjects.sort((a, b) => {
            const at = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
            const bt = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
            return bt - at;
        });
        displayProjects();
    }, (err) => {
        console.error(err);
        projectGrid.innerHTML = '<p class="EmptyState">Failed to load scripts.</p>';
    });
}

function openDetail(projectId) {
    const project = currentProjects.find(p => p.id === projectId);
    if (!project) return;
    activeProject = project;

    detailTitle.textContent = project.title || "Untitled";
    detailCreator.textContent = project.authorName ? "by " + project.authorName : "by Anonymous";
    detailDescription.textContent = project.description || "No description.";
    detailCode.textContent = project.code || "";

    commentInput.value = "";
    subscribeToComments(projectId);

    detailView.classList.add("show");
    document.body.style.overflow = "hidden";
}

function closeDetail() {
    detailView.classList.remove("show");
    document.body.style.overflow = "";
    activeProject = null;
    if (commentsUnsubscribe) {
        commentsUnsubscribe();
        commentsUnsubscribe = null;
    }
}

function subscribeToComments(projectId) {
    if (commentsUnsubscribe) {
        commentsUnsubscribe();
        commentsUnsubscribe = null;
    }
    const q = query(
        collection(db, "projects", projectId, "comments"),
        orderBy("createdAt", "asc")
    );
    commentsUnsubscribe = onSnapshot(q, (snapshot) => {
        renderComments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
        console.error(err);
        commentsList.innerHTML = '<p class="EmptyState" style="padding:20px">Failed to load comments.</p>';
    });
}

function renderComments(comments) {
    commentsList.innerHTML = "";
    if (comments.length === 0) {
        const empty = document.createElement("p");
        empty.className = "EmptyState";
        empty.style.padding = "20px";
        empty.textContent = "No comments yet.";
        commentsList.appendChild(empty);
        return;
    }
    comments.forEach(c => {
        const div = document.createElement("div");
        div.className = "Comment";

        const author = document.createElement("div");
        author.className = "CommentAuthor";
        author.textContent = c.authorName || "Anonymous";

        const text = document.createElement("div");
        text.className = "CommentText";
        text.textContent = c.text || "";

        const time = document.createElement("div");
        time.className = "CommentTime";
        const ts = c.createdAt && c.createdAt.seconds ? c.createdAt.seconds * 1000 : null;
        time.textContent = ts ? new Date(ts).toLocaleString() : "";

        div.appendChild(author);
        div.appendChild(text);
        div.appendChild(time);
        commentsList.appendChild(div);
    });
    commentsList.scrollTop = commentsList.scrollHeight;
}

backButton.addEventListener("click", closeDetail);

copyCodeButton.addEventListener("click", async () => {
    if (!activeProject) return;
    try {
        await navigator.clipboard.writeText(activeProject.code || "");
        const original = copyCodeButton.textContent;
        copyCodeButton.textContent = "Copied!";
        setTimeout(() => { copyCodeButton.textContent = original; }, 1500);
    } catch (e) {
        copyCodeButton.textContent = "Error";
        setTimeout(() => { copyCodeButton.textContent = "Receive"; }, 1500);
    }
});

postCommentButton.addEventListener("click", async () => {
    if (!activeProject) return;
    if (!currentUser) {
        openAuth();
        return;
    }
    const text = commentInput.value.trim();
    if (!text) return;
    if (text.length > 1000) return;
    postCommentButton.disabled = true;
    try {
        await withTimeout(addDoc(collection(db, "projects", activeProject.id, "comments"), {
            text: text,
            authorId: currentUser.uid,
            authorName: currentUser.name,
            createdAt: serverTimestamp()
        }), 15000);
        commentInput.value = "";
    } catch (e) {
        console.error(e);
    } finally {
        postCommentButton.disabled = false;
    }
});

commentInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        postCommentButton.click();
    }
});

function changePage(page) {
    currentPage = page;
    pageTitle.style.opacity = "0";
    pageTitle.style.transform = "translateY(5px)";
    setTimeout(() => {
        pageTitle.textContent = pageTitles[page];
        pageTitle.style.opacity = "1";
        pageTitle.style.transform = "translateY(0)";
    }, 120);
    navButtons.forEach(button => {
        button.classList.toggle("active", button.dataset.page === page);
    });
    if (currentUser) {
        subscribeToProjects(page);
    }
}

navButtons.forEach(button => {
    button.addEventListener("click", () => {
        changePage(button.dataset.page);
    });
});

searchbar.addEventListener("input", displayProjects);

function openAddModal() {
    if (!currentUser) {
        openAuth();
        return;
    }
    scriptLanguage.value = currentPage;
    scriptTitle.value = "";
    scriptDescription.value = "";
    scriptCode.value = "";
    addMessage.textContent = "";
    addModal.classList.add("show");
}

function closeAddModal() {
    addModal.classList.remove("show");
}

addButton.addEventListener("click", openAddModal);
closeModal.addEventListener("click", closeAddModal);
cancelAdd.addEventListener("click", closeAddModal);

addModal.addEventListener("click", (e) => {
    if (e.target === addModal) closeAddModal();
});

publishScript.addEventListener("click", async () => {
    if (!currentUser) {
        openAuth();
        return;
    }
    const lang = scriptLanguage.value;
    const title = scriptTitle.value.trim();
    const description = scriptDescription.value.trim();
    const code = scriptCode.value.trim();

    addMessage.textContent = "";

    if (!title) {
        addMessage.textContent = "Please enter a title.";
        return;
    }
    if (title.length > 100) {
        addMessage.textContent = "Title too long (max 100).";
        return;
    }
    if (description.length > 2000) {
        addMessage.textContent = "Description too long (max 2000).";
        return;
    }
    if (!code) {
        addMessage.textContent = "Please provide the script code.";
        return;
    }
    if (code.length > 100000) {
        addMessage.textContent = "Code too long (max 100000).";
        return;
    }

    publishScript.disabled = true;
    const originalText = publishScript.textContent;
    publishScript.textContent = "Publishing...";

    try {
        const newDocRef = doc(collection(db, "projects"));
        await withTimeout(setDoc(newDocRef, {
            title: title,
            description: description,
            code: code,
            language: lang,
            authorId: currentUser.uid,
            authorName: currentUser.name,
            createdAt: serverTimestamp()
        }), 15000);

        closeAddModal();
        if (currentPage !== lang) {
            changePage(lang);
        }
    } catch (e) {
        console.error(e);
        if (e.message === "timeout") {
            addMessage.textContent = "Connection blocked. Disable your ad blocker for this site.";
        } else {
            addMessage.textContent = "Failed to publish. Try again.";
        }
    } finally {
        publishScript.disabled = false;
        publishScript.textContent = originalText;
    }
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = {
            uid: user.uid,
            name: user.displayName || user.email.split("@")[0]
        };
        userLabel.textContent = currentUser.name;
        closeAuth();
        subscribeToProjects(currentPage);
    } else {
        currentUser = null;
        userLabel.textContent = "";
        if (projectsUnsubscribe) { projectsUnsubscribe(); projectsUnsubscribe = null; }
        if (commentsUnsubscribe) { commentsUnsubscribe(); commentsUnsubscribe = null; }
        currentProjects = [];
        projectGrid.innerHTML = "";
        closeDetail();
        setAuthMode("login");
        openAuth();
    }
});
