import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalModule, BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { NgSelectModule } from '@ng-select/ng-select';
import { ApiService } from '../../services/api.service';
import { BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import {  ToastrService } from 'ngx-toastr';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';

interface Project {
  id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
  description?: string;
  company?: string;
  status?: string;
}

interface User {
  id: string;
  name: string;
  email?: string;
  photo?: string;
  department?: string;
}

interface Task {
  id: string;
  _id?: string;
  title: string;
  description: string;
  project_id: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEW';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignee: string;
  due_date: string | null;
  start_date: string | null;
  startDate?: string | null;
  endDate?: string | null;
  allocated_hours: number;
  tags: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  project?: Project;
  subtasks?: Task[];
  isSubTask?: boolean;
  parentId?: string;
}

export interface TaskDetail {
  _id?: string;
  title?: string;
  createdDate?: string;
  startDate?: string;
  endDate?: string;
  allocatedHours?: number;
  workedHours?: number;
  estimatedTime?: number;
  desc?: string;
  priority?: string;
  taskType?: string;
  billingType?: boolean;
  tags?: string[];
  status?: string;
  parentId?: string;
  isSubTask?: boolean;
  isRecurring?: boolean;
  recurringDays?: string;
  recurringId?: string;
  isScheduleType?: string;
  isScheduled?: boolean;
  taskGroup?: string;
  isTimeEntry?: string;
  creatorTeamName?: string;
  role?: string;
  extendDate?: any;
  isReOpen?: boolean;
  endDateReason?: string;
  canExtend?: boolean;
  modifiedDate?: string;
  lastActivity?: string;
  clientRequest?: boolean;
  reqType?: string;
  activityTags?: string;
  isActivity?: string;
  activityId?: string;
  rating?: string;
  isActive?: boolean;
  section?: any[];
  rollOver?: any[];
  shared?: any[];
  extendList?: any[];
  taskAttachment?: any[];
  attachmentList?: any;
  buckets?: any;
  project?: {
    _id?: string;
    id?: string;
    name?: string;
  };
  clients?: {
    _id?: string;
    id?: string;
    name?: string;
  }[];
  creatorId?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    userImage?: string;
    email?: string;
    team?: any[];
  };
  users?: {
    assigned?: {
      _id?: string;
      id?: string;
      userId?: string;
      firstName?: string;
      lastName?: string;
      middleName?: string;
      userImage?: string;
      email?: string;
      team?: string;
      displayTeamName?: string;
      isStatus?: string;
      assignedDate?: string;
    }[];
    followers?: any[];
    reAssigned?: any[];
  };
}

interface GroupedProject {
  project: any;
  tasks: Array<{
    task: any;
    subtasks: any[];
  }>;
}

@Component({
  selector: 'app-my-work',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalModule, BsDatepickerModule, NgSelectModule, ReactiveFormsModule, BsDropdownModule],
  templateUrl: './my-work.component.html',
  styleUrls: ['./my-work.component.css']
})
export class MyWorkComponent implements OnInit {
  @ViewChild('clientModal') openclientTemplate!: TemplateRef<any>;
  @ViewChild('clientModal2') openclientTemplate2!: TemplateRef<any>;
  @ViewChild('taskdetailModal') opentaskdetailtTemplate!: TemplateRef<any>;
  modalRef?: BsModalRef;
  tasks: Task[] = [];
  taskDetail?: TaskDetail | null;
  showAllAssignees = false;
  projects: Project[] | any = [];
  groupBy: 'status' | 'project' = 'status';
  showCompletedTasks = false;
  showAddTaskModal = false;
  expandedTasks: Set<string> = new Set();
  expandedProject: Set<string> = new Set();
  showInlineForm: { [key: string]: boolean } = {};
  showDatePicker: { [key: string]: boolean } = {};
  showStatusDropdown: { [key: string]: boolean } = {};
  showTagEdit: { [key: string]: boolean } = {};
  showFilterDropdown = false;
  editingTag: { [key: string]: string } = {};
  userRole: string = "";
  userTeamName: string = "";
  datePickerData: { [key: string]: { start: string; end: string } } = {};
  groupedProjects: any | Array<{
    project: any;
    tasks: Array<{ task: any; subtasks: any[] }>;
  }> = [];

  newTask = {
    title: '',
    description: '',
    project_id: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    start_date: '',
    due_date: '',
    allocated_hours: 0,
    assignee: '',
    tags: ''
  };

  inlineTask = {
    title: '',
    description: '',
    status: 'TODO' as 'TODO' | 'IN_PROGRESS' | 'COMPLETED',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    assignee: '',
    tags: ''
  };
  inlineTasks: { [projectId: string]: any } = {};

  taskForm!: FormGroup;
  subtaskForm!: FormGroup;
  project: any[] = [];
  tags: any[] = [];
  clients: any[] = [];
  buckets: any[] = [];
  assignUsers: any[] = [];
  followers: any[] = [];
  parentTaskList: any[] = [];
  isLoadingParentTasks = false;

  userId = "";
  dateRange: Date[] = [];
  bsConfig: Partial<BsDatepickerConfig>;

  statusLabels: Record<string, string> = {
    TODO: 'TO DO',
    IN_PROGRESS: 'IN PROGRESS',
    REVIEW: 'REVIEW',
    COMPLETED: 'COMPLETED',
    ACCEPTED: 'ACCEPTED',
    CLOSED: 'CLOSED'
  };
  statuses: string[] = [];
  tasksByStatus: Record<string, any[]> = {};
  expandedStatus = new Set<string>();
  imageBaseUrl = "https://d386sc5j3a9jwt.cloudfront.net/img/user-images/";
  defaultImage = this.imageBaseUrl + "user.png";
  categories: string[] = [
    'Analysis', 'Discovery', 'Scripting', 'Development', 'Monitoring',
    'Testing', 'Queueing', 'Documentation', 'Architect/Design', 'R&D',
    'Deployment', 'Processing', 'Execution', 'Activity'
  ];
  selectedCategory: string | null = null;
  uploadedFiles: File[] = [];

  isEditMode = false;
currentTaskId: string = '';
editTaskForm!: FormGroup;
editEndDate: Date | null = null;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private modalService: BsModalService,
    private api: ApiService
  ) {
    this.bsConfig = {
      isAnimated: true,
      dateInputFormat: 'MMMM DD, YYYY',
      rangeInputFormat: 'MMMM DD, YYYY',
      showWeekNumbers: false
    };
  }

  async ngOnInit() {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      this.userId = user.id;
    }
    const today = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);
    this.dateRange = [today, sevenDaysLater];

    await this.loadData();
    this.initForm();
    this.initSubtaskForm();
    await this.loadProjects();
    await this.loadTags();
    this.initEditTaskForm(); 
  }

  initEditTaskForm() {
    this.editTaskForm = this.fb.group({
      endDate: ['', Validators.required],
      project: [null, Validators.required],
      client: [[], Validators.required],
      tags: [[]],
      assignTo: [[], Validators.required],
      billing: ['NON_BILLABLE', Validators.required],
      requirementType: ['NEW', Validators.required],
      priority: ['MEDIUM', Validators.required],
      description: ['']
    });
  }
  
  get editFormControls() {
    return this.editTaskForm.controls;
  }


  initForm() {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      allocatedHours: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      project: [null, Validators.required],
      client: [[], Validators.required],
      bucket: [null],
      category: [null],
      tags: [[]],
      assignTo: [[], Validators.required],
      followers: [[]],
      priority: ['MEDIUM', Validators.required],
      billing: ['NON_BILLABLE', Validators.required],
      requirementType: ['NEW', Validators.required]
    });
  }
  get sf(): any {
    return this.subtaskForm?.controls || {};
  }
  initSubtaskForm() {
    this.subtaskForm = this.fb.group({
      title: ['', Validators.required],
      allocatedHours: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      project: ['', Validators.required],
      parentTask: ['', Validators.required],
      assignTo: ['', Validators.required],
      tags: [[]],
      description: ['']
    });
    
  }

  get formControls() {
    return this.taskForm.controls;
  }

  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
  async loadSubtasksForAllTasks() {
    try {
      // Instead of fetching individually, we can filter tasks that are subtasks
      // and group them with their parents
      const allTasks = [...this.tasks];
      
      for (const task of this.tasks) {
        const taskId = task.id || task._id;
        
        // Initialize subtasks array
        (task as any).subtasks = [];
        
        // Try to fetch from API first
        if (taskId) {
          try {
            const subtasks: any = await this.api.get(`planner/subTasks/${taskId}`);
            if (Array.isArray(subtasks) && subtasks.length > 0) {
              (task as any).subtasks = subtasks;
              continue; 
            }
          } catch (err: any) {
            // API failed, will use alternative method below
            console.log(`API endpoint not available for task ${taskId}, using alternative method`);
          }
        }
        
        // Alternative: Find subtasks from the loaded tasks
        // Tasks that have isSubTask=true and parentId matching this task
        const foundSubtasks = allTasks.filter((t: any) => 
          t.isSubTask === true && 
          (t.parentId === taskId || t.parent_id === taskId)
        );
        
        if (foundSubtasks.length > 0) {
          (task as any).subtasks = foundSubtasks;
        }
      }
    } catch (error) {
      console.error('Error loading subtasks:', error);
      // Ensure all tasks have empty subtasks array on error
      this.tasks.forEach((task: any) => {
        if (!task.subtasks) {
          task.subtasks = [];
        }
      });
    }
  }


  async loadData() {
    try {
      const [projectsRes, tasksRes]: any = await Promise.all([
        this.api.get(`projects/listByUser/${this.userId}`),
        this.api.get(`tasks/new/${this.userId}`),
      ]);
  
      const projects = Array.isArray(projectsRes) ? projectsRes : [];
      const tasks = Array.isArray(tasksRes) ? tasksRes : [];
  
      const flattenedTasks = tasks.reduce((acc, project) => {
        if (project.tasks && Array.isArray(project.tasks)) {
          return [...acc, ...project.tasks];
        }
        return acc;
      }, []);
  
      const projectMap = new Map();
      projects.forEach((p: any) => {
        if (p.id && !projectMap.has(p.id)) {
          projectMap.set(p.id, p);
        }
      });
  
      tasks.forEach((item: any) => {
        if (item.id && item.name && !projectMap.has(item.id)) {
          projectMap.set(item.id, {
            id: item.id,
            name: item.name
          });
        }
      });
  
      this.projects = Array.from(projectMap.values());
      
      // CRITICAL FIX: Separate parent tasks and subtasks with better detection
      const parentTasks: any[] = [];
      const subtasks: any[] = [];
      
      flattenedTasks.forEach((task: any) => {
        // Normalize task data
        const normalizedTask = {
          ...task,
          id: task.id || task._id,
          _id: task._id || task.id,
          subtasks: [] // Initialize empty subtasks array
        };
        
        // Enhanced subtask detection - check multiple possible fields
        const isSubtask = 
          task.isSubTask === true || 
          task.parentTask || 
          task.parentId || 
          task.parent_id ||
          task.parentTaskId;
        
        if (isSubtask) {
          subtasks.push(normalizedTask);
        } else {
          parentTasks.push(normalizedTask);
        }
      });
      
      // Attach subtasks to their parent tasks
      subtasks.forEach((subtask: any) => {
        // Get parent ID from any possible field
        const parentId = 
          subtask.parentTask || 
          subtask.parentId || 
          subtask.parent_id || 
          subtask.parentTaskId;
        
        if (parentId) {
          const parentTask = parentTasks.find((pt: any) => 
            pt.id === parentId || pt._id === parentId
          );
          
          if (parentTask) {
            if (!parentTask.subtasks) {
              parentTask.subtasks = [];
            }
            
            // Transform subtask tags to match template structure
            if (subtask.tags && Array.isArray(subtask.tags)) {
              subtask.tags = subtask.tags.map((tag: any) => {
                if (typeof tag === 'string') {
                  // If tag is just a string ID, find the full tag object
                  const fullTag = this.tags.find(t => t.tagId === tag);
                  return {
                    name: fullTag?.tagName || tag,
                    tagId: tag
                  };
                } else if (tag.name) {
                  // Tag already has correct structure
                  return tag;
                } else {
                  // Tag might have different structure
                  return {
                    name: tag.tagName || tag.name || 'Unknown',
                    tagId: tag.tagId || tag._id || tag.id
                  };
                }
              });
            } else {
              subtask.tags = [];
            }
            
            parentTask.subtasks.push(subtask);
          } else {
            // If parent not found in current list, add subtask as regular task
            console.warn(`Parent task ${parentId} not found for subtask ${subtask.id}`);
            parentTasks.push(subtask);
          }
        } else {
          // No parent ID found, treat as regular task
          console.warn(`No parent ID found for subtask ${subtask.id}`);
          parentTasks.push(subtask);
        }
      });
      
      // Transform parent task tags as well
      parentTasks.forEach((task: any) => {
        if (task.tags && Array.isArray(task.tags)) {
          task.tags = task.tags.map((tag: any) => {
            if (typeof tag === 'string') {
              const fullTag = this.tags.find(t => t.tagId === tag);
              return {
                name: fullTag?.tagName || tag,
                tagId: tag
              };
            } else if (tag.name) {
              return tag;
            } else {
              return {
                name: tag.tagName || tag.name || 'Unknown',
                tagId: tag.tagId || tag._id || tag.id
              };
            }
          });
        } else {
          task.tags = [];
        }
      });
      
      // Use only parent tasks (which now contain their subtasks)
      this.tasks = this.removeDuplicates(parentTasks, 'id');
      
      this.groupTasksByProject();
      this.groupTasksByStatus();
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }
  
  
  // Updated groupTasksByProject to preserve subtasks
  groupTasksByProject() {
    const projectMap = new Map();
    this.projects.forEach((project: any) => {
      if (project.id) {
        projectMap.set(project.id, { ...project, tasks: [] });
      }
    });
  
    this.tasks.forEach((task: any) => {
      const projectId = task.project_id || task.project?.id || task.project?._id || task.projectId;
      if (projectId) {
        // Ensure subtasks array exists (it should already from loadData)
        if (!task.subtasks) {
          task.subtasks = [];
        }
        
        if (projectMap.has(projectId)) {
          const project = projectMap.get(projectId);
          project.tasks.push(task);
        } else {
          projectMap.set(projectId, {
            id: projectId,
            name: task.project?.name || 'Unknown Project',
            color: '',
            icon: '',
            created_at: '',
            tasks: [task]
          });
        }
      }
    });
  
    this.projects = Array.from(projectMap.values());
  }
  
  // Updated to only show parent tasks in status view
  groupTasksByStatus() {
    this.tasksByStatus = {};
    
    // Only process parent tasks (subtasks are nested within them)
    for (const task of this.tasks) {
      let status: string = task.status || 'TODO';
      const statusMap: Record<string, string> = {
        'Closed': 'COMPLETED',
        'New': 'TODO',
        'Completed': 'COMPLETED',
        'TODO': 'TODO',
        'IN_PROGRESS': 'IN_PROGRESS',
        'REVIEW': 'REVIEW',
        'ACCEPTED': 'TODO',
        'Accepted': 'TODO'
      };
      status = statusMap[status] || status;
      if (!this.tasksByStatus[status]) {
        this.tasksByStatus[status] = [];
      }
      this.tasksByStatus[status].push(task);
    }
    this.statuses = Object.keys(this.tasksByStatus);
  }


  removeDuplicates(items: any[], key: string): any[] {
    const uniqueItemsMap = new Map();
    items.forEach(item => {
      const itemKey = item[key] || item._id;
      if (itemKey && !uniqueItemsMap.has(itemKey)) {
        uniqueItemsMap.set(itemKey, item);
      }
    });
    return Array.from(uniqueItemsMap.values());
  }

  get filteredTasks(): Task[] {
    if (this.showCompletedTasks) {
      return this.tasks;
    }
    return this.tasks.filter(task => task.status !== 'COMPLETED');
  }

  toggleStatusExpansion(status: string) {
    if (this.expandedStatus.has(status)) {
      this.expandedStatus.delete(status);
    } else {
      this.expandedStatus.add(status);
    }
  }

  get tasksByProject(): { [key: string]: Task[] } {
    const groups: { [key: string]: Task[] } = {};
    this.projects.forEach((project: any) => {
      groups[project.id] = this.filteredTasks.filter(t => t.project_id === project.id);
    });
    return groups;
  }

  toggleGroupBy(type?: 'status' | 'project') {
    if (type) {
      this.groupBy = type;
    } else {
      this.groupBy = this.groupBy === 'status' ? 'project' : 'status';
    }
  }

  toggleCompletedTasks() {
    this.showCompletedTasks = !this.showCompletedTasks;
  }

  toggleTaskExpansion(taskId: string) {
    if (this.expandedTasks.has(taskId)) {
      this.expandedTasks.delete(taskId);
    } else {
      this.expandedTasks.add(taskId);
    }
  }

  toggleProjectExpansion(id: string) {
    if (this.expandedProject.has(id)) {
      this.expandedProject.delete(id);
    } else {
      this.expandedProject.add(id);
    }
  }

  toggleInlineForm(projectId: string) {
    this.showInlineForm[projectId] = !this.showInlineForm[projectId];
    if (!this.inlineTasks[projectId]) {
      this.inlineTasks[projectId] = {
        title: '',
        description: '',
        status: 'TODO',
        priority: 'MEDIUM',
        assignee: '',
        tags: ''
      };
    }
  }

  async createInlineTask(projectId: string) {
    try {
      const taskData = this.inlineTasks[projectId];
      if (!taskData || !taskData.title?.trim()) return;

      const project = this.groupedProjects.find(
        (p: GroupedProject) => p.project.id === projectId
      );
      const isDuplicate = project?.tasks.some(
        (t: any) => t.task.title.trim().toLowerCase() === taskData.title.trim().toLowerCase()
      );

      if (isDuplicate) {
        console.warn("Duplicate task title blocked");
        return;
      }

      const tagsArray = taskData.tags?.split(",").map((t: string) => t.trim()).filter((t: string) => t.length > 0) || [];

      const payload = {
        creatorId: this.userId,
        parentId: "0",
        isSubTask: true,
        isRecurring: false,
        taskGroup: "allocated",
        taskType: "Development",
        role: "Developer",
        status: taskData.status,
        title: taskData.title,
        desc: taskData.description ? `<p>${taskData.description}</p>` : "",
        allocatedHours: 0,
        priority: taskData.priority,
        createdDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        users: {
          assigned: taskData.assignee ? [{ _id: taskData.assignee }] : []
        },
        project: {
          id: projectId,
          name: this.getProject(projectId)?.name || ""
        },
        tags: tagsArray
      };

      const createdTask: any = await this.api.post("planner/create/", payload);

      if (project) {
        project.tasks.unshift({
          task: createdTask,
          subtasks: []
        });
      }

      this.inlineTasks[projectId] = {
        title: "",
        description: "",
        status: "TODO",
        priority: "MEDIUM",
        assignee: "",
        tags: ""
      };

      this.toggleInlineForm(projectId);
    } catch (error) {
      console.error("Error creating task:", error);
    }
  }

  async deleteTask(taskId: string) {
    try {
      await this.api.delete(`planner/delete/${taskId}`);
      this.tasks = this.tasks.filter(t => t.id !== taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }

  getProject(projectId: string): Project | undefined {
    return this.projects.find((p: any) => p.id === projectId);
  }

  getStatusBadgeClass(status: string): string {
    if (!status) return 'status-default';
    switch (status.trim().toUpperCase()) {
      case 'CLOSED':
        return 'status-closed';
      case 'COMPLETED':
        return 'status-completed';
      case 'ACCEPTED':
        return 'status-accepted';
      default:
        return 'status-default';
    }
  }

  getPriorityFlagColor(priority: string): string {
    if (!priority) return '#9ca3af';
    switch (priority.trim().toUpperCase()) {
      case 'HIGH':
        return '#f87171';
      case 'MEDIUM':
        return '#fbbf24';
      case 'LOW':
        return '#34d399';
      default:
        return '#9ca3af';
    }
  }

  formatDateRange(startDate: string | null, endDate: string | null): string {
    if (!startDate && !endDate) return 'No date range';

    const formatShort = (date: string) => {
      const d = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const compareDate = new Date(d);
      compareDate.setHours(0, 0, 0, 0);

      if (compareDate.getTime() === today.getTime()) return 'Today';
      if (compareDate.getTime() === tomorrow.getTime()) return 'Tomorrow';

      const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
      return d.toLocaleDateString('en-US', options);
    };

    if (startDate && endDate) {
      const formattedStart = formatShort(startDate);
      const formattedEnd = formatShort(endDate);
      return `${formattedStart} → ${formattedEnd}`;
    }

    return startDate ? formatShort(startDate) : formatShort(endDate!);
  }

  toggleDatePicker(taskId: string, task: Task) {
    this.showDatePicker[taskId] = !this.showDatePicker[taskId];
    if (this.showDatePicker[taskId]) {
      this.datePickerData[taskId] = {
        start: task.start_date || '',
        end: task.due_date || ''
      };
    }
  }

  async saveDateRange(taskId: string) {
    try {
      const data = this.datePickerData[taskId];
      const payload = {
        startDate: data.start || null,
        endDate: data.end || null,
        modifiedDate: new Date().toISOString()
      };
      await this.api.put(`planner/update/${taskId}`, payload);
      await this.loadData();
      this.showDatePicker[taskId] = false;
    } catch (error) {
      console.error('Error updating date:', error);
    }
  }

  cancelDatePicker(taskId: string) {
    this.showDatePicker[taskId] = false;
    delete this.datePickerData[taskId];
  }

  toggleStatusDropdown(taskId: string) {
    this.showStatusDropdown[taskId] = !this.showStatusDropdown[taskId];
    if (this.showStatusDropdown[taskId]) {
      Object.keys(this.showStatusDropdown).forEach(key => {
        if (key !== taskId) this.showStatusDropdown[key] = false;
      });
      this.showDatePicker = {};
      this.showTagEdit = {};
    }
  }

  async changeStatus(taskId: string, status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEW') {
    try {
      const payload = {
        status,
        modifiedDate: new Date().toISOString()
      };
      await this.api.put(`planner/update/${taskId}`, payload);
      await this.loadData();
      this.showStatusDropdown[taskId] = false;
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  toggleTagEdit(taskId: string, currentTags: string[]) {
    this.showTagEdit[taskId] = !this.showTagEdit[taskId];
    if (this.showTagEdit[taskId]) {
      this.editingTag[taskId] = currentTags.join(', ');
      Object.keys(this.showTagEdit).forEach(key => {
        if (key !== taskId) this.showTagEdit[key] = false;
      });
      this.showDatePicker = {};
      this.showStatusDropdown = {};
    }
  }

  async saveTag(taskId: string) {
    try {
      const tagsArray = this.editingTag[taskId]
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      await this.api.put(`planner/update/${taskId}`, { tags: tagsArray, modifiedDate: new Date().toISOString() });
      await this.loadData();
      this.showTagEdit[taskId] = false;
    } catch (error) {
      console.error('Error updating tags:', error);
    }
  }

  cancelTagEdit(taskId: string) {
    this.showTagEdit[taskId] = false;
    delete this.editingTag[taskId];
  }

  toggleFilterDropdown() {
    this.showFilterDropdown = !this.showFilterDropdown;
  }

  onFileSelected(event: any) {
    this.uploadedFiles = [...this.uploadedFiles, ...event.target.files];
  }

  removeFile(index: number) {
    this.uploadedFiles.splice(index, 1);
  }

  openclientPopup() {
    this.modalRef = this.modalService.show(this.openclientTemplate, {
      class: 'custom-modal-width'
    });
  }

  openclientPopup2() {
    this.modalRef = this.modalService.show(this.openclientTemplate2, {
      class: 'custom-modal-width'
    });
  }

  closemodalPopup3() {
    this.modalRef?.hide();
  }

  closemodalPopup5() {
    this.modalRef?.hide();
    this.subtaskForm.reset();
    this.parentTaskList = [];
    const today = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);
    this.dateRange = [today, sevenDaysLater];
  }

  opentaskdetailtPopup(task: any) {
    const taskId = task;
    if (!taskId) {
      console.error("No Task ID found!");
      return;
    }
    this.currentTaskId = taskId;  
    this.isEditMode = false; 
    const endpoint = `tasks/?ti=${taskId}`;
    this.api.get(endpoint).then((res: any) => {
      this.taskDetail = res;
      this.modalRef = this.modalService.show(this.opentaskdetailtTemplate, {
        class: 'custom-modal-width'
      });
    });
  }

  closemodalPopup4() {
    this.modalRef?.hide();
    this.isEditMode = false; 
    this.currentTaskId = '';
  }

  onImageError(event: any) {
    event.target.src = this.defaultImage;
  }

  onDateRangeChange(event: Date[]) {
    if (event && event.length === 2) {
      this.dateRange = event;
      this.taskForm.patchValue({
        startDate: event[0],
        endDate: event[1]
      });
      this.subtaskForm.patchValue({
        startDate: event[0],
        endDate: event[1]
      });
    }
  }

  async loadProjects() {
    this.project = await this.api.get(`projects/listByUser/${this.userId}`) as any[];
  }

  async loadTags() {
    const res: any = await this.api.get(`tags/?ui=${this.userId}`);
  
    const admin = res[0]?.adminTags?.map((t: any) => ({
      tagId: t.tagId,
      tagName: t.name
    })) || [];
  
    const assigned = res[0]?.assignedTags?.map((t: any) => ({
      tagId: t._id.tagId,
      tagName: t._id.name
    })) || [];
  
    // Merge & remove duplicates
    const map = new Map();
    [...admin, ...assigned].forEach((t: any) => map.set(t.tagId, t));
  
    this.tags = [...map.values()];
  }
  

  async loadClients(projectId: string) {
    const res: any = await this.api.get(`projects/clients/${projectId}`);
    this.clients = res[0]?.clients || [];
  }

  async loadBuckets(projectId: string) {
    const res: any = await this.api.get(`projects/buckets/${projectId}`);
    this.buckets = res[0]?.buckets || [];
  }

  async loadUsers(projectId: string) {
    const res: any = await this.api.get(`projects/usersListByProject/${projectId}`);
    const assigned = res[0]?.users?.assigned || [];
    this.assignUsers = assigned.map((u: any) => {
      const img = u.userImage;
      const isValidImage = img && !/^\d+_/.test(img) && img.toLowerCase() !== 'null' && img.toLowerCase() !== 'undefined' && img.trim() !== '';
      return {
        id: u.userId,
        name: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email,
        department: u.team && u.team.length > 0 ? u.team[0].name : "No Team",
        photo: isValidImage ? this.imageBaseUrl + img : this.defaultImage
      };
    });
    this.followers = [...this.assignUsers];
  }

  async loadParentTasks(projectId: string) {
    try {
      const response: any = await this.api.get(`tasks/?pro=${projectId}&ui=${this.userId}`);
      console.log("Parent Tasks Response:", response);
      this.parentTaskList = (response || []).filter((task: any) =>
        !task.isSubTask && task.status !== 'Closed' && task.status !== 'Completed'
      );
    } catch (error) {
      console.error("Error loading parent tasks:", error);
      this.parentTaskList = [];
      throw error;
    }
  }

  async onProjectChange(projectId: string) {
    if (!projectId) return;
    this.clients = [];
    this.buckets = [];
    this.assignUsers = [];
    this.followers = [];
    await this.loadClients(projectId);
    await this.loadBuckets(projectId);
    await this.loadUsers(projectId);
    this.taskForm.patchValue({
      client: null,
      bucket: null,
      assignTo: null,
      followers: []
    });
    this.taskForm.get('client')?.enable();
    this.taskForm.get('bucket')?.enable();
    this.taskForm.get('assignTo')?.enable();
    this.taskForm.get('followers')?.enable();
  }

  async onSubtaskProjectChange(projectId: string) {
    if (!projectId) return;
    this.parentTaskList = [];
    this.assignUsers = [];
    this.isLoadingParentTasks = true;
    try {
      await this.loadParentTasks(projectId);
      await this.loadUsers(projectId);
      this.subtaskForm.patchValue({
        parentTask: null,
        assignTo: null
      });
      this.subtaskForm.get('parentTask')?.enable();
      this.subtaskForm.get('assignTo')?.enable();
    } catch (error) {
      console.error("Error loading subtask dependencies:", error);
      this.toastr.error("Failed to load parent tasks", "Error");
    } finally {
      this.isLoadingParentTasks = false;
    }
  }

  async submitSubTask() {
    if (this.subtaskForm.invalid) {
      this.markFormGroupTouched(this.subtaskForm);
      return;
    }
  
    const [startDate, endDate] = this.dateRange || [];
    const selectedProject = this.subtaskForm.value.project;
    const projectId = selectedProject?.id || selectedProject?._id || selectedProject;
    const parentTaskId = this.subtaskForm.value.parentTask;
  
    const formatDate = (date: Date | string) => {
      if (!date) return "";
      const d = new Date(date);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().split("T")[0];
    };
  
    const payload = {
      creatorId: this.userId,
      assignerId: this.userId,
      parentTask: parentTaskId,
      isSubTask: true,
      status: "New",
      title: this.subtaskForm.value.title,
      desc: this.subtaskForm.value.description
        ? `<p>${this.subtaskForm.value.description}</p>`
        : "",
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      allocatedHours: Number(this.subtaskForm.value.allocatedHours),
      workedHours: 0,
      createdDate: formatDate(new Date()),
      modifiedDate: formatDate(new Date()),
      lastActivity: formatDate(new Date()),
      assignTo: this.subtaskForm.value.assignTo,
      project: {
        _id: projectId,
        name: selectedProject?.name || ""
      },
      tags: this.subtaskForm.value.tags || []
    };
  
    try {
      const createdSubtask: any = await this.api.post(
        `tasks/?title=${encodeURIComponent(payload.title)}&pro=${projectId}`,
        payload
      );
  
      // Transform tags to match template structure
      const transformedTags = (this.subtaskForm.value.tags || []).map((tagId: string) => {
        const tag = this.tags.find(t => t.tagId === tagId);
        return {
          name: tag?.tagName || tagId,
          tagId: tagId
        };
      });
  
      const normalizedSubtask = {
        id: createdSubtask._id || createdSubtask.id,
        _id: createdSubtask._id || createdSubtask.id,
        title: createdSubtask.title,
        description: createdSubtask.desc || createdSubtask.description || '',
        status: createdSubtask.status || 'New',
        priority: createdSubtask.priority || 'MEDIUM',
        start_date: createdSubtask.startDate || createdSubtask.start_date || formatDate(startDate),
        due_date: createdSubtask.endDate || createdSubtask.due_date || formatDate(endDate),
        tags: transformedTags,  // Use transformed tags
        users: createdSubtask.assignTo || [],
        isSubTask: true,
        parentTask: parentTaskId
      };
  
      // Attach to parent task
      if (parentTaskId) {
        for (let project of this.projects) {
          const parentTask = project.tasks.find((t: Task) => t.id === parentTaskId || t._id === parentTaskId);
          if (parentTask) {
            if (!parentTask.subtasks) parentTask.subtasks = [];
            parentTask.subtasks.push(normalizedSubtask);
            this.expandedTasks.add(parentTaskId);
            break;
          }
        }
      }
  
      this.projects = [...this.projects];
  
      this.toastr.success("Subtask created successfully!", "Success");
      this.closemodalPopup5();
      this.subtaskForm.reset();
  
    } catch (err: any) {
      console.error("Error creating subtask:", err);
      this.toastr.error("Failed to create subtask", "Error");
    }
  }
  

  async submitTask() {
    if (this.taskForm.invalid) {
      this.markFormGroupTouched(this.taskForm);
      console.log('Form is invalid');
      return;
    }
    
    const [startDate, endDate] = this.dateRange || [];
    const selectedProject = this.taskForm.value.project;
    const projectId = selectedProject?.id || selectedProject;
    
    const format = (date: Date | string) => {
      if (!date) return "";
      const d = new Date(date);
      if (isNaN(d.getTime())) return "";
      const yyyy = d.getFullYear();
      const mm = (d.getMonth() + 1).toString().padStart(2, "0");
      const dd = d.getDate().toString().padStart(2, "0");
      const hh = d.getHours().toString().padStart(2, "0");
      const min = d.getMinutes().toString().padStart(2, "0");
      const ss = d.getSeconds().toString().padStart(2, "0");
      return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    };
    
    const formattedStartDate = format(startDate);
    const formattedEndDate = format(endDate);
    
    const payload = {
      _Id: this.userId,
      project: {
        name: selectedProject?.name || this.getProject(projectId)?.name || "",
        id: projectId
      },
      parentId: "0",
      isSubTask: true,
      isRecurring: false,
      recurringDays: "",
      recurringId: "",
      isScheduleType: "",
      taskGroup: "allocated",
      isTimeEntry: "1",
      isScheduled: false,
      taskType: this.taskForm.value.category,
      creatorTeamName: this.userTeamName,
      role: this.userRole,
      status: "New",
      title: this.taskForm.value.title,
      desc: this.taskForm.value.description,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      extendDate: null,
      isReOpen: false,
      allocatedHours: Number(this.taskForm.value.allocatedHours),
      workedHours: 0,
      estimatedTime: 0,
      endDateReason: "",
      canExtend: false,
      priority: this.taskForm.value.priority,
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      clientRequest: false,
      billingType: this.taskForm.value.billing === "BILLABLE",
      reqType: this.taskForm.value.requirementType,
      activityTags: "",
      isActivity: "0",
      activityId: "",
      rating: "",
      isActive: true,
      tags: this.taskForm.value.tags || [],
      section: [],
      rollOver: [],
      shared: [],
      creatorId: this.userId,
      clients: (this.taskForm.value.client || []).map((clientId: string) => ({
        id: clientId,
        name: this.clients.find(client => client.id === clientId)?.name || ''
      })),
      extendList: [],
      users: {
        assigned: (this.taskForm.value.assignTo as string[] || [])
          .map((id: string) => this.assignUsers.find(u => u.id === id))
          .filter((u): u is User => !!u),
        followers: (this.taskForm.value.followers as string[] || [])
          .map((id: string) => this.followers.find(u => u.id === id))
          .filter((u): u is User => !!u),
        reAssigned: []
      },
      taskAttachment: [],
      email: true,
      __v: 0,
      attachmentList: {},
      buckets: this.taskForm.value.bucket
        ? (Array.isArray(this.taskForm.value.bucket)
          ? this.taskForm.value.bucket
          : [this.taskForm.value.bucket])
        : [],
      edDate: formattedStartDate,
      stDate: formattedEndDate
    };
    
    try {
      const createdTask: any = await this.api.post(`tasks`, payload);
      
      let responseProjectId = createdTask.project?.id ||
        createdTask.project?._id ||
        createdTask.projectId ||
        createdTask.project_id ||
        projectId;
      
      // Transform tags to match template structure
      const transformedTags = (this.taskForm.value.tags || []).map((tagId: string) => {
        const tag = this.tags.find(t => t.tagId === tagId);
        return {
          name: tag?.tagName || tagId,
          tagId: tagId
        };
      });
      
      const normalizedTask = {
        id: createdTask._id || createdTask.id,
        _id: createdTask._id || createdTask.id,
        title: createdTask.title,
        description: createdTask.desc || createdTask.description || '',
        project_id: responseProjectId,
        status: this.mapStatusFromAPI(createdTask.status),
        priority: createdTask.priority || 'MEDIUM',
        assignee: createdTask.users?.assigned?.[0]?._id ||
          createdTask.users?.assigned?.[0]?.id || '',
        due_date: createdTask.endDate || createdTask.due_date || formattedEndDate || null,
        start_date: createdTask.startDate || createdTask.start_date || formattedStartDate || null,
        allocated_hours: createdTask.allocatedHours || 0,
        tags: transformedTags, 
        created_by: createdTask.creatorId || this.userId,
        created_at: createdTask.createdDate || new Date().toISOString(),
        updated_at: createdTask.modifiedDate || new Date().toISOString(),
        project: {
          id: responseProjectId,
          name: createdTask.project?.name || selectedProject?.name || 'Unknown',
          color: '',
          icon: '',
          created_at: ''
        },
        subtasks: []  
      };
      
      this.tasks.unshift(normalizedTask);
      
      const targetProject = this.projects.find((p: any) => p.id === responseProjectId);
      if (targetProject) {
        if (!targetProject.tasks) {
          targetProject.tasks = [];
        }
        targetProject.tasks.unshift(normalizedTask);
        this.expandedProject.add(responseProjectId);
      }
      
      this.groupTasksByStatus();
      
      if (this.groupBy === 'status') {
        const status = normalizedTask.status;
        this.expandedStatus.add(status);
      }
      
      this.projects = [...this.projects];
      
      this.closemodalPopup3();
      this.toastr.success("Task created successfully!", "Success");
      
      this.taskForm.reset({
        priority: 'MEDIUM',
        billing: 'NON_BILLABLE',
        requirementType: 'NEW'
      });
      
      const today = new Date();
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(today.getDate() + 7);
      this.dateRange = [today, sevenDaysLater];
      
    } catch (err: any) {
      console.error("Error creating task:", err);
      if (err.message && err.message.includes("Cannot read properties of undefined")) {
        this.toastr.error("Task created but notification settings are missing. Please contact administrator.", "Partial Success");
      } else {
        this.toastr.error("Failed to create task", "Error");
      }
    }
  }
  
  
  // Helper method to map API status to your interface status
  private mapStatusFromAPI(apiStatus: string): 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEW' {
    const statusMap: Record<string, 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEW'> = {
      'New': 'TODO',
      'TODO': 'TODO',
      'IN_PROGRESS': 'IN_PROGRESS',
      'In Progress': 'IN_PROGRESS',
      'REVIEW': 'REVIEW',
      'Review': 'REVIEW',
      'COMPLETED': 'COMPLETED',
      'Completed': 'COMPLETED',
      'Closed': 'COMPLETED',
      'ACCEPTED': 'TODO',
      'Accepted': 'TODO'
    };
    
    return statusMap[apiStatus] || 'TODO';
  }

  // Helper to format dates as 'YYYY-MM-DD HH:mm:ss'
  formatApiDate(date: Date): string {
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  onEditEndDateChange(date: Date) {
    if (date) {
      this.editEndDate = date;
      this.editTaskForm.patchValue({
        endDate: date
      });
    }
  }

  canEditTask(): boolean {
    if (!this.taskDetail || !this.taskDetail.creatorId) {
      return false;
    }
    const creatorId = this.taskDetail.creatorId._id || this.taskDetail.creatorId;
    return creatorId === this.userId;
  }
  
  async enableEditMode() {
    if (!this.canEditTask()) {
      this.toastr.error("You don't have permission to edit this task", "Error");
      return;
    }
  
    this.isEditMode = true;
  
    // Load project-specific data
    const projectId = (this.taskDetail?.project as any)?._id || (this.taskDetail?.project as any)?.id;
    if (projectId) {
      await this.loadClients(projectId);
      await this.loadUsers(projectId);
    }
  
    // Prepare date for the date range picker
    this.editEndDate = this.taskDetail?.endDate ? new Date(this.taskDetail.endDate) : new Date();

  
    // Patch form values
    this.editTaskForm.patchValue({
      endDate: this.editEndDate,
      project: (this.taskDetail?.project as any)?._id || (this.taskDetail?.project as any)?.id,
      client: (this.taskDetail?.clients || []).map((c: any) => c._id || c.id),
      tags: (this.taskDetail?.tags || []).map((t: any) => {
        if (typeof t === 'string') return t;
        return t.tagId || t._id || t.id;
      }),
      assignTo: (this.taskDetail?.users?.assigned || []).map((u: any) => u._id || u.id || u.userId),
      billing: this.taskDetail?.billingType ? 'BILLABLE' : 'NON_BILLABLE',
      requirementType: this.taskDetail?.taskType || 'NEW',
      priority: this.taskDetail?.priority || 'MEDIUM',
      description: this.taskDetail?.desc?.replace(/<[^>]*>/g, '') || ''
    });
  }
  
  cancelEditMode() {
    this.isEditMode = false;
    this.editTaskForm.reset();
  }
  
  async updateTask() {
    if (this.editTaskForm.invalid) {
      this.markFormGroupTouched(this.editTaskForm);
      this.toastr.error("Please fill all required fields", "Error");
      return;
    }
  
    const formValue = this.editTaskForm.value;
    const endDate = this.editEndDate || new Date();
  
    const formatDate = (date: Date | string) => {
      if (!date) return "";
      const d = new Date(date);
      if (isNaN(d.getTime())) return "";
      return d.toISOString();
    };
  
    // Get selected project
    const selectedProject = this.project.find(p => (p._id || p.id) === formValue.project);
    
    // Get assigned users with full details
    const assignedUsers = (formValue.assignTo || []).map((userId: string) => {
      const user = this.assignUsers.find(u => u.id === userId);
      if (!user) return null;
      
      return {
        isStatus: "active",
        assignedDate: new Date().toISOString(),
        _id: userId,
        firstName: user.name.split(' ')[0] || '',
        middleName: " ",
        lastName: user.name.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        userImage: user.photo?.replace(this.imageBaseUrl, '') || '',
        team: user.department || '',
        displayTeamName: user.department?.substring(0, 2).toUpperCase() || ''
      };
    }).filter((u: any) => u !== null);
  
    // Get selected clients with full details
    const selectedClients = (formValue.client || []).map((clientId: string) => {
      const client = this.clients.find(c => (c._id || c.id) === clientId);
      return {
        _id: clientId,
        id: clientId,
        name: client?.name || ''
      };
    });
  
    // Build the complete payload matching your structure
    const payload: any = {
      project: {
        name: selectedProject?.name || '',
        id: formValue.project
      },
      users: {
        assigned: assignedUsers,
        followers: this.taskDetail?.users?.followers || [],
        reAssigned: this.taskDetail?.users?.reAssigned || []
      },
      parentId: this.taskDetail?.parentId || "0",
      isSubTask: this.taskDetail?.isSubTask || false,
      isRecurring: this.taskDetail?.isRecurring || false,
      recurringDays: this.taskDetail?.recurringDays || "",
      recurringId: this.taskDetail?.recurringId || "",
      isScheduleType: this.taskDetail?.isScheduleType || "",
      isScheduled: this.taskDetail?.isScheduled || false,
      taskGroup: this.taskDetail?.taskGroup || "allocated",
      isTimeEntry: this.taskDetail?.isTimeEntry || "1",
      taskType: formValue.requirementType,
      creatorTeamName: this.taskDetail?.creatorTeamName || this.userTeamName,
      role: this.taskDetail?.role || this.userRole,
      status: this.taskDetail?.status || "New",
      title: this.taskDetail?.title || '',
      desc: formValue.description ? `<p>${formValue.description}</p>` : (this.taskDetail?.desc || ''),
      startDate: this.taskDetail?.startDate || formatDate(new Date()),
      endDate: formatDate(endDate),
      extendDate: this.taskDetail?.extendDate || null,
      isReOpen: this.taskDetail?.isReOpen || false,
      allocatedHours: this.taskDetail?.allocatedHours || 0,
      estimatedTime: this.taskDetail?.estimatedTime || 0,
      workedHours: this.taskDetail?.workedHours || 0,
      endDateReason: this.taskDetail?.endDateReason || "",
      canExtend: this.taskDetail?.canExtend || false,
      priority: formValue.priority,
      createdDate: this.taskDetail?.createdDate || new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      clientRequest: this.taskDetail?.clientRequest || false,
      billingType: formValue.billing === 'BILLABLE',
      reqType: formValue.requirementType,
      activityTags: this.taskDetail?.activityTags || "",
      isActivity: this.taskDetail?.isActivity || "0",
      activityId: this.taskDetail?.activityId || "",
      rating: this.taskDetail?.rating || "",
      isActive: this.taskDetail?.isActive !== undefined ? this.taskDetail.isActive : true,
      tags: formValue.tags || [],
      section: this.taskDetail?.section || [],
      rollOver: this.taskDetail?.rollOver || [],
      shared: this.taskDetail?.shared || [],
      creatorId: this.taskDetail?.creatorId || { _id: this.userId },
      clients: selectedClients,
      extendList: this.taskDetail?.extendList || [],
      taskAttachment: this.taskDetail?.taskAttachment || [],
      email: true,
      stDate: this.taskDetail?.startDate || formatDate(new Date()),
      edDate: formatDate(endDate),
      attachmentList: this.taskDetail?.attachmentList || {}
    };
  
    // Add buckets if they exist
    if (this.taskDetail?.buckets) {
      payload.buckets = this.taskDetail.buckets;
    }
  
    try {
      await this.api.put(`tasks/${this.currentTaskId}`, payload);
      
      this.toastr.success("Task updated successfully!", "Success");
      
      // Reload task details
      const endpoint = `tasks/?ti=${this.currentTaskId}`;
      const updatedTask: any = await this.api.get(endpoint);
      this.taskDetail = updatedTask;
      
      // Reload the main task list
      await this.loadData();
      
      this.isEditMode = false;
    } catch (error) {
      console.error("Error updating task:", error);
      this.toastr.error("Failed to update task", "Error");
    }
  }
  
  async onEditProjectChange(projectId: string) {
    if (!projectId) return;
    
    // Clear and reload based on project
    this.clients = [];
    this.assignUsers = [];
    
    await this.loadClients(projectId);
    await this.loadUsers(projectId);
    
    // Reset dependent fields
    this.editTaskForm.patchValue({
      client: [],
      assignTo: []
    });
  }
}




