// ---------------- VARIABLES ----------------
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let editIndex = -1;

const el = {
  form: q("form"),
  taskInput: q("#taskInput"),
  category: q("#category"),
  dueDate: q("#dueDate"),
  taskList: q("#task-list"),
  progress: q("#progress"),
  numbers: q("#numbers"),
  modeToggle: q("#modeToggle"),
  voiceBtn: q("#voiceBtn"),
  filter: q("#filter"),
  search: q("#search"),
};

const icons = { work:"💼", study:"📚", personal:"👤", shopping:"🛒", other:"📌" };
const milestones = {
  2:"🎉 Awesome! 2 tasks done",
  5:"💪 Great! 5 tasks completed",
  10:"🚀 Wow! 10 tasks crushed",
  20:"🔥 Legend! 20 tasks finished"
};
function q(s){return document.querySelector(s)}
const save=()=>localStorage.setItem("tasks",JSON.stringify(tasks));
const refresh=()=>{renderList();updateStats();save()};

// ---------------- INIT ----------------
document.addEventListener("DOMContentLoaded",()=>{
  renderList();updateStats();
  if(localStorage.getItem("theme")==="light"){
    document.body.classList.add("light-mode");
    el.modeToggle.checked=true;
  }
});

// ---------------- ADD / EDIT ----------------
el.form.addEventListener("submit",e=>{
  e.preventDefault();
  const text=el.taskInput.value.trim(),cat=el.category.value,date=el.dueDate.value;
  if(!text||!date) return alert("⚠️ Enter task & date");

  editIndex>=0
    ? tasks[editIndex]={...tasks[editIndex],text,category:cat,dueDate:date}
    : tasks.push({text,category:cat,dueDate:date,completed:false});

  editIndex=-1;el.form.reset();refresh();
});

// ---------------- TASK ACTIONS ----------------
const toggle=i=>(tasks[i].completed^=1,refresh());
const del=i=>confirm("Delete task?")&&(tasks.splice(i,1),refresh());
const edit=i=>{
  Object.assign(el.taskInput,{value:tasks[i].text});
  Object.assign(el.category,{value:tasks[i].category});
  Object.assign(el.dueDate,{value:tasks[i].dueDate});
  editIndex=i;el.taskInput.focus();
};

// ---------------- STATS ----------------
function updateStats(){
  const done=tasks.filter(t=>t.completed).length,total=tasks.length;
  el.progress.style.width=`${total?(done/total)*100:0}%`;
  el.numbers.textContent=`${done} / ${total}`;
  if(total&&done===total) confetti({particleCount:200,spread:80,origin:{y:.6}});
  milestones[done]&&popup(milestones[done]);
}

// ---------------- LIST RENDER ----------------
function renderList(){
  el.taskList.innerHTML=""; const today=new Date().toISOString().split("T")[0];
  let list=[...tasks];

  // Search + Filter
  if(el.search.value) list=list.filter(t=>t.text.toLowerCase().includes(el.search.value.toLowerCase()));
  if(el.filter.value==="completed") list=list.filter(t=>t.completed);
  if(el.filter.value==="pending") list=list.filter(t=>!t.completed);

  list.forEach((t,i)=>{
    const diff=(new Date(t.dueDate)-new Date(today))/86400000;
    let due=""; 
    if(!t.completed){
      if(t.dueDate<today) due="⏰ Overdue";
      else if(diff<=1) due="🔔 Due Soon";
    }

    const li=document.createElement("li");
    li.innerHTML=`<div class="taskItem">
        <div class="task ${t.completed?"completed":""}">
          <input type="checkbox" ${t.completed?"checked":""}/>
          <p>${icons[t.category]||"📌"} ${t.text} <small>(Due: ${t.dueDate}) ${due}</small></p>
        </div>
        <div class="icons">
          <img src="./img/edit.png" class="editBtn" alt="Edit"/>
          <img src="./img/bin.png" class="deleteBtn" alt="Delete"/>
        </div></div>`;

    li.querySelector("input").onchange=()=>toggle(i);
    li.querySelector(".editBtn").onclick=()=>edit(i);
    li.querySelector(".deleteBtn").onclick=()=>del(i);
    el.taskList.appendChild(li);
  });
}

// ---------------- POPUP ----------------
function popup(msg){
  const p=document.createElement("div");
  p.className="popup-message";p.innerHTML=`<p>${msg}</p>`;document.body.appendChild(p);
  setTimeout(()=>p.classList.add("show"),50);
  setTimeout(()=>{p.classList.remove("show");setTimeout(()=>p.remove(),500)},2500);
}

// ---------------- THEME ----------------
el.modeToggle.onchange=e=>{
  document.body.classList.toggle("light-mode",e.target.checked);
  localStorage.setItem("theme",e.target.checked?"light":"dark");
};

// ---------------- VOICE INPUT ----------------
if(el.voiceBtn){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(SR){
    const rec=new SR();rec.lang="en-US";
    rec.onstart=()=>el.voiceBtn.textContent="🎤 Listening...";
    rec.onend=()=>el.voiceBtn.textContent="🎙️";
    rec.onresult=e=>{
      let txt=e.results[0][0].transcript.toLowerCase(),cat="other",date=new Date();
      const cats={work:["work","office","project"],study:["study","exam"],personal:["personal","health"],shopping:["shopping","buy"],other:["other","misc"]};
      for(let c in cats) if(cats[c].some(w=>txt.includes(w)))cat=c;
      if(/tomorrow/.test(txt))date.setDate(date.getDate()+1);
      else if(/next week/.test(txt))date.setDate(date.getDate()+7);
      const m=txt.match(/(\d{1,2}) (january|february|march|april|may|june|july|august|september|october|november|december)/i);
      if(m){let d=new Date(`${m[1]} ${m[2]} ${date.getFullYear()}`);if(!isNaN(d))date=d}
      el.taskInput.value=txt;el.category.value=cat;el.dueDate.value=date.toISOString().split("T")[0];
    };
    el.voiceBtn.onclick=()=>rec.start();
  } else el.voiceBtn.style.display="none";
}

// ---------------- FILTER + SEARCH ----------------
el.filter.onchange=renderList;
el.search.oninput=renderList;