export function sideProjectLabels(locale='en') {
  return /^zh\b/i.test(locale)?{
    title:'在项目中工作',description:'在所选项目中新建侧聊，保留当前对话',
    empty:'没有可用的项目工作目录',failed:'未能打开项目侧聊，请稍后重试。'
  }:{
    title:'Work in a project',description:'Open a new project side chat and keep this conversation',
    empty:'No project working directories are available',failed:'The project side chat could not be opened. Please try again.'
  };
}

export function sideProjectLocation(project) {
  if(typeof project?.path!=='string'||!project.path.trim())return null;
  const hostId=typeof project.hostId==='string'&&project.hostId?project.hostId:project.projectKind==='remote'?null:'local';
  if(!hostId)return null;
  return {cwd:project.path,hostId,title:project.label||project.name||project.path};
}

export async function openProjectSideChat(project,{open}) {
  const location=sideProjectLocation(project);
  if(!location)throw Error('This project has no supported working directory.');
  return await open({sourceConversationId:null,cwd:location.cwd,hostId:location.hostId,displayTitle:location.title,target:'right'});
}

export function createSideProjectCommand({projects=[],busy=false,locale='en',currentCwd,Icon,onSelect}) {
  const labels=sideProjectLabels(locale),available=projects.filter(project=>sideProjectLocation(project)!=null);
  return {id:'project',triggers:['/','@'],title:labels.title,description:labels.description,requiresEmptyComposer:false,Icon,
    enabled:!busy&&available.length>0,dependencies:[projects,busy,currentCwd,onSelect],
    submenu:{sections:[{id:'side-projects',emptyState:labels.empty,items:available.map(project=>({
      id:project.projectId??project.path,title:project.label||project.name||project.path,
      description:project.path,searchAliases:[project.path,project.projectId??''],Icon,
      disabled:busy,onSelect:()=>onSelect(project)
    }))}]}};
}
