const pageTitles = {
    executor: "Executor Scripts",
    html: "HTML",
    python: "Python",
    luau: "LuaU"
};

const pageTitle = document.getElementById("PageTitle");
const searchbar = document.getElementById("Searchbar");
const navButtons = document.querySelectorAll(".NavButton");
const mobileNav = document.getElementById("MobileNav");
const projectGrid = document.getElementById("ProjectGrid");

const addButton = document.getElementById("AddButton");
const addModal = document.getElementById("AddModal");
const closeModal = document.getElementById("CloseModal");
const cancelAdd = document.getElementById("CancelAdd");
const publishScript = document.getElementById("PublishScript");
const scriptAuthor = document.getElementById("ScriptAuthor");
const scriptLanguage = document.getElementById("ScriptLanguage");
const scriptTitle = document.getElementById("ScriptTitle");
const scriptDescription = document.getElementById("ScriptDescription");
const scriptCode = document.getElementById("ScriptCode");
const addMessage = document.getElementById("AddMessage");

const dailyLoginButton = document.getElementById("DailyLoginButton");
const dailyModal = document.getElementById("DailyModal");
const closeDaily = document.getElementById("CloseDaily");
const rewardGrid = document.getElementById("RewardGrid");

const rewardPopup = document.getElementById("RewardPopup");
const closeReward = document.getElementById("CloseReward");
const sendEmailButton = document.getElementById("SendEmailButton");

const detailView = document.getElementById("DetailView");
const backButton = document.getElementById("BackButton");
const detailTitle = document.getElementById("DetailTitle");
const detailCreator = document.getElementById("DetailCreator");
const detailDescription = document.getElementById("DetailDescription");
const detailCode = document.getElementById("DetailCode");
const copyCodeButton = document.getElementById("CopyCodeButton");
const commentsList = document.getElementById("CommentsList");
const commentName = document.getElementById("CommentName");
const commentInput = document.getElementById("CommentInput");
const postCommentButton = document.getElementById("PostCommentButton");

let currentPage = "executor";
let activeProject = null;

const CLAIMED_KEY = "ext_claimed_rewards";
const COMMENTS_KEY = "ext_comments";

const GH_SCRIPTS = Array.isArray(window.EXTERNAL_SCRIPTS) ? window.EXTERNAL_SCRIPTS : [];

function loadClaimed() {
    try {
        const parsed = JSON.parse(localStorage.getItem(CLAIMED_KEY));
        if (Array.isArray(parsed)) return parsed;
    } catch {}
    return [];
}

function saveClaimed(list) {
    localStorage.setItem(CLAIMED_KEY, JSON.stringify(list));
}

function loadAllComments() {
    try {
        const parsed = JSON.parse(localStorage.getItem(COMMENTS_KEY));
        if (parsed && typeof parsed === "object") return parsed;
    } catch {}
    return {};
}

function saveAllComments(data) {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(data));
}

function getComments(projectId) {
    const all = loadAllComments();
    return Array.isArray(all[projectId]) ? all[projectId] : [];
}

function addComment(projectId, comment) {
    const all = loadAllComments();
    if (!Array.isArray(all[projectId])) all[projectId] = [];
    all[projectId].push(comment);
    saveAllComments(all);
}

function displayProjects() {
    projectGrid.innerHTML = "";
    const q = searchbar.value.trim().toLowerCase();
    const list = GH_SCRIPTS.filter(p => p.language === currentPage);
    const filtered = list.filter(p => {
        if (!q) return true;
        return (p.title || "").toLowerCase().includes(q) ||
               (p.description || "").toLowerCase().includes(q);
    });

    if (filtered.length === 0) {
        const empty = document.createElement("p");
        empty.className = "EmptyState";
        empty.textContent = q ? "No scripts match your search." : "No scripts here yet.";
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

function openDetail(projectId) {
    const project = GH_SCRIPTS.find(p => p.id === projectId);
    if (!project) return;
    activeProject = project;

    detailTitle.textContent = project.title || "Untitled";
    detailCreator.textContent = project.authorName ? "by " + project.authorName : "by Anonymous";
    detailDescription.textContent = project.description || "No description.";
    detailCode.textContent = project.code || "";

    commentInput.value = "";
    renderComments(getComments(projectId));

    detailView.classList.add("show");
    document.body.style.overflow = "hidden";
}

function closeDetail() {
    detailView.classList.remove("show");
    document.body.style.overflow = "";
    activeProject = null;
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
    comments
        .slice()
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
        .forEach(c => {
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
            time.textContent = c.createdAt ? new Date(c.createdAt).toLocaleString() : "";

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

postCommentButton.addEventListener("click", () => {
    if (!activeProject) return;
    const name = commentName.value.trim() || "Anonymous";
    const text = commentInput.value.trim();
    if (!text) return;
    if (text.length > 1000) return;

    addComment(activeProject.id, {
        text: text,
        authorName: name.slice(0, 24),
        createdAt: Date.now()
    });
    commentInput.value = "";
    renderComments(getComments(activeProject.id));
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
    if (mobileNav) mobileNav.value = page;
    displayProjects();
}

navButtons.forEach(button => {
    button.addEventListener("click", () => {
        changePage(button.dataset.page);
    });
});

if (mobileNav) {
    mobileNav.addEventListener("change", () => {
        changePage(mobileNav.value);
    });
}

searchbar.addEventListener("input", displayProjects);

function openAddModal() {
    scriptLanguage.value = currentPage;
    scriptAuthor.value = "";
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

publishScript.addEventListener("click", () => {
    const author = scriptAuthor.value.trim() || "Anonymous";
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

    const to = "fiyorir726@94an.com";
    const subject = "External Script Upload";
    const body =
        "Title > " + title + "\n" +
        "Author > " + author + "\n" +
        "Description > " + description + "\n" +
        "Code Language > " + lang + "\n" +
        "\n" +
        "Code >\n" +
        code + "\n";

    const url = "https://mail.google.com/mail/?view=cm&fs=1" +
        "&to=" + encodeURIComponent(to) +
        "&su=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

    window.open(url, "_blank");
    closeAddModal();
});

const REWARDS = [
    { id: "free-account", title: "Free Account", handle: "@linuxdistr0" }
];

function renderRewards() {
    rewardGrid.innerHTML = "";
    const claimed = loadClaimed();

    REWARDS.forEach(reward => {
        const card = document.createElement("div");
        card.className = "RewardCard";
        if (claimed.includes(reward.id)) card.classList.add("claimed");

        const title = document.createElement("div");
        title.className = "RewardCardTitle";
        title.textContent = reward.title;

        const handle = document.createElement("div");
        handle.className = "RewardCardHandle";
        handle.textContent = reward.handle;

        card.appendChild(title);
        card.appendChild(handle);

        card.addEventListener("click", () => {
            if (claimed.includes(reward.id)) return;
            if (reward.id === "free-account") {
                rewardPopup.classList.add("show");
            }
        });

        rewardGrid.appendChild(card);
    });
}

function markClaimed(rewardId) {
    const claimed = loadClaimed();
    if (!claimed.includes(rewardId)) {
        claimed.push(rewardId);
        saveClaimed(claimed);
    }
    renderRewards();
}

dailyLoginButton.addEventListener("click", () => {
    renderRewards();
    dailyModal.classList.add("show");
});

closeDaily.addEventListener("click", () => {
    dailyModal.classList.remove("show");
});

dailyModal.addEventListener("click", (e) => {
    if (e.target === dailyModal) dailyModal.classList.remove("show");
});

closeReward.addEventListener("click", () => {
    rewardPopup.classList.remove("show");
});

rewardPopup.addEventListener("click", (e) => {
    if (e.target === rewardPopup) rewardPopup.classList.remove("show");
});

sendEmailButton.addEventListener("click", () => {
    const to = "fiyorir726@94an.com";
    const subject = "Free Account";
    const body = "Passkey/2-DA8w9r3307ASD-33";
    const url = "https://mail.google.com/mail/?view=cm&fs=1" +
        "&to=" + encodeURIComponent(to) +
        "&su=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

    window.open(url, "_blank");
    markClaimed("free-account");
});

displayProjects();
