import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import {  ModalModule,BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { ApiService } from '../../services/api.service';
import {  ToastrService } from 'ngx-toastr';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, ReactiveFormsModule,ModalModule],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {
  @ViewChild('projectModal') projectModalTpl!: TemplateRef<any>;
  @ViewChild('projectFormModal') openModalTemplate!: TemplateRef<any>;
  @ViewChild('clientModal') openclientTemplate!: TemplateRef<any>;
  modalRef?: BsModalRef;
  showModal = false;
  viewMode: 'grid' | 'list' = 'grid';
  projectForm!: FormGroup;
  clientForm!: FormGroup;
  bucketForm!: FormGroup;
  clients: any[] = [];
  buckets: any[] = [];
  users: any[] = [];
  filteredUsers: any[] = [];
  projects: any[] = [];
  editingProject: any = null;
  searchTerm: string = '';
  filteredProjects: any[] = [];
  selectedProjectId: string | null = null;
  selectedBuckets: string[] = [];

  imageBaseUrl = "https://d386sc5j3a9jwt.cloudfront.net/img/user-images/";
  defaultImage = this.imageBaseUrl + "user.png";

  constructor(private fb: FormBuilder, private api: ApiService, private toastr: ToastrService,private modalService: BsModalService) {}

  ngOnInit(): void {
    this.projectForm = this.fb.group({
      name: ['', Validators.required],
      client: [null, Validators.required],
      participants: [[], Validators.required],
      incharge: [null],
      owners: [[]],
      timeEntry: [true]
    });

    this.clientForm = this.fb.group({
      name: ['', Validators.required]
    });

    this.bucketForm = this.fb.group({
      projectId: [null, Validators.required],
      buckets: [[], Validators.required]
    });

    this.loadClients();
    this.loadUsers();

    this.projectForm.get('participants')?.valueChanges.subscribe(selectedIds => {
      if (!Array.isArray(selectedIds)) {
        this.filteredUsers = [];
        this.projectForm.patchValue({ incharge: null, owners: [] }, { emitEvent: false });
        return;
      }

      this.filteredUsers = this.users.filter(u => selectedIds.includes(u._id));

      const incharge = this.projectForm.get('incharge')?.value;
      const owners = this.projectForm.get('owners')?.value || [];

      if (incharge && !selectedIds.includes(incharge)) {
        this.projectForm.patchValue({ incharge: null }, { emitEvent: false });
      }

      this.projectForm.patchValue({
        owners: owners.filter((o: string) => selectedIds.includes(o))
      }, { emitEvent: false });
    });

    this.loadProjects();
    this.loadBuckets();
  }

  openModal(project: any = null) {
    this.editingProject = project;

    if (project) {
      // EDIT MODE → Set values
      this.projectForm.patchValue({
        name: project.name,
        client: project.clients.map((c: any) => c.id),
        participants: project.users.assigned.map((u: any) => u.userId),
        incharge: project.users.incharge.map((u: any) => u.userId),
        owners: project.users.owner.map((u: any) => u.userId),
        timeEntry: project.timeEntry
      });

      this.filteredUsers = this.users.filter(u =>
        project.users.assigned.map((x: any) => x.userId).includes(u._id)
      );
    }

    this.modalRef = this.modalService.show(this.openModalTemplate);

  }

  closeModal() {
    this.showModal = false;
    this.editingProject = null;
    this.projectForm.reset();
  }

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }


  async loadProjects() {
    const data = await this.api.get('projects') as any[];
    this.projects = data.sort((a, b) => {
      const d1 = new Date(b.modifiedDate || b.createdDate);
      const d2 = new Date(a.modifiedDate || a.createdDate);
      return d1.getTime() - d2.getTime();
    });
    this.filteredProjects = [...this.projects];

  }
  // --------------------
  // Load All Buckets
  // --------------------
  async loadBuckets() {
    this.buckets = await this.api.get('buckets') as any[];
  }

  // --------------------
  // Enable bucket selection
  // --------------------
  onProjectSelect() {
    const projectId = this.bucketForm.get('projectId')?.value;
  
    if (!projectId) {
      this.bucketForm.get('buckets')?.disable();
      this.bucketForm.get('buckets')?.reset([]);
    } else {
      this.bucketForm.get('buckets')?.enable();
    }
  }

  async loadClients() {
    try {
      const response = await this.api.get('clients');
      this.clients = response as any[];
    } catch (error) {
      console.error("Failed to load clients", error);
    }
  }

  async loadUsers() {
    this.users = await this.api.get('users') as any[];
  }
  onSearch() {
    const term = this.searchTerm.trim().toLowerCase();
  
    if (!term) {
      this.filteredProjects = [...this.projects];
      return;
    }
  
    this.filteredProjects = this.projects.filter(p => {
      const projectNameMatch = p.name?.toLowerCase().includes(term);
      const clientMatch = (p.clients ?? []).some((c: any) =>
        c.name?.toLowerCase().includes(term)
      );
      return projectNameMatch || clientMatch;
    });
  }
  // -----------------------------------------------------
  // 🔵 FIXED IMAGE HANDLER
  // -----------------------------------------------------
  getUserImage(user: any) {
    if (!user?.userImage) {
      return this.defaultImage;
    }

    if (user.userImage.startsWith('http')) {
      return user.userImage;
    }

    return this.imageBaseUrl + user.userImage;
  }

  onImageError(event: any) {
    event.target.src = this.defaultImage;
  }

  // -----------------------------------------------------
  // 🔵 USER MAP HELPERS
  // -----------------------------------------------------
  buildUserArray(ids: string[], date: string) {
    return ids.map(uid => {
      const u = this.users.find(x => x._id === uid);
      if (!u) return null;

      return {
        userId: u._id,
        firstName: u.firstName,
        middleName: u.middleName || "",
        lastName: u.lastName,
        email: u.email,
        userImage: u.userImage,
        team: u.team,
        assignedDate: date,
        releasedDate: null
      };
    }).filter(Boolean);
  }

  buildRemovedUsers(prevAssigned: any[], newIds: string[]) {
    const now = new Date().toISOString();

    return prevAssigned
      .filter(u => !newIds.includes(u.userId))
      .map(u => ({ ...u, releasedDate: now }));
  }

  // -----------------------------------------------------
  // 🔵 CREATE OR UPDATE
  // -----------------------------------------------------
  async onSubmit() {
    if (this.projectForm.invalid) {
      this.projectForm.markAllAsTouched();
      return;
    }

    const form = this.projectForm.value;
    const now = new Date().toISOString();

    if (!this.editingProject) {
      return this.createProject(form, now);
    } else {
      return this.updateProject(form, now);
    }
  }

  // -----------------------------------------------------
  // 🔵 CREATE PROJECT
  // -----------------------------------------------------
  async createProject(form: any, now: string) {
    const payload = {
      name: form.name,
      createdBy: "siva ramamurthy",
      creatorId: "5d9fd81b3d598088d2ea5dc7",
      status: "active",
      createdDate: now,
      modifiedDate: null,

      clients: form.client.map((cid: any) => {
        const c = this.clients.find(x => x._id === cid);
        return { id: cid, name: c?.name };
      }),

      buckets: [],

      users: {
        assigned: this.buildUserArray(form.participants, now),
        incharge: this.buildUserArray(form.incharge, now),
        owner: this.buildUserArray(form.owners, now),
        removed: [],
        requested: []
      },

      timeEntry: form.timeEntry,
      logo: "",
      lastActivity: null,
      workedHours: 0
    };
 
    await this.api.post('projects', payload);


    this.modalRef?.hide();
    this.toastr.success('Project created successfully!', 'Success');
    this.loadProjects();
  }

  // -----------------------------------------------------
  // 🔵 UPDATE PROJECT
  // -----------------------------------------------------

  openEdit(project: any) {
    this.editingProject = project;
    this.modalRef = this.modalService.show(this.openModalTemplate);
  
    const assignedIds = project.users?.assigned?.map((u: any) => u.userId) || [];
    const inchargeId = project.users?.incharge?.map((u: any) => u.userId) || [];
    const ownerIds = project.users?.owner?.map((u: any) => u.userId) || [];
  
    this.projectForm.patchValue({
      name: project.name,
      client: project.clients?.map((c: any) => c.id) || [],
      participants: assignedIds,
      incharge: inchargeId,
      owners: ownerIds,
      timeEntry: project.timeEntry
    });
  
    // Filter users for dropdown (ONLY users inside participants list)
    this.filteredUsers = this.users.filter(u => assignedIds.includes(u._id));
  }
  
  async updateProject(form: any, now: string) {
    const prev = this.editingProject;

    const payload = {
      name: form.name,
      createdBy: prev.createdBy,
      creatorId: prev.creatorId,
      modifiedDate: now,

      clients: form.client.map((cid: string) => {
        const c = this.clients.find(x => x._id === cid);
        return { id: cid, name: c?.name };
      }),

      buckets: prev.buckets || [],

      users: {
        assigned: this.buildUserArray(form.participants, now),
        incharge: this.buildUserArray(form.incharge, now),
        owner: this.buildUserArray(form.owners, now),
        removed: this.buildRemovedUsers(prev.users.assigned, form.participants)
      },

      timeEntry: form.timeEntry
    };
   
    await this.api.put(`projects/${prev._id}`, payload);
    this.toastr.success('Project updated successfully!', 'Success');

    this.modalRef?.hide();

    this.loadProjects();
  }

  
  openmodalPopup() {
    this.bucketForm.reset();

  // disable buckets until project is selected
  this.bucketForm.get('buckets')?.disable();
    this.modalRef = this.modalService.show(this.projectModalTpl, {});
  }
  openclientPopup() {
    this.modalRef = this.modalService.show(this.openclientTemplate, {});
  }
  
  closemodalPopup() {
    this.modalRef?.hide();
  }
  
  closemodalPopup2() {
    this.modalRef?.hide();
  }
  closemodalPopup3() {
    this.modalRef?.hide();
  }
    // --------------------
  // Save Buckets to Project
  // --------------------
  async submitBucket() {
    if (this.bucketForm.invalid) {
      this.bucketForm.markAllAsTouched();
      return;
    }
  
    const projectId = this.bucketForm.value.projectId;
    const selectedBuckets = this.bucketForm.value.buckets;
  
    try {
      const project = this.projects.find(p => p._id === projectId);
  
      if (!project) {
        this.toastr.error('Project not found');
        return;
      }
  
      const newBuckets = this.buckets
        .filter(b => selectedBuckets.includes(b._id))
        .map(b => ({
          name: b.name,
          project: project.name
        }));
  
      const requestBody = {
        buckets: [...(project.buckets || []), ...newBuckets]
      };
  
      // 👀 SEE PAYLOAD BEFORE SENDING
      console.log("📦 FINAL BUCKET PAYLOAD:", requestBody);
  
      await this.api.put(`projects/${projectId}`, requestBody);
  
      this.toastr.success('Bucket added successfully!');
      this.closemodalPopup();
      
      this.bucketForm.reset();
      this.loadProjects();
  
    } catch (err) {
      console.error("❌ Error while adding bucket:", err);
      this.toastr.error("Failed to add buckets");
    }
  }
  


async submitClient() {
  if (this.clientForm.invalid) {
    return;
  }

  const body = {
    name: this.clientForm.value.name
  };

  // 👀 SEE PAYLOAD BEFORE SENDING
  console.log("📦 CLIENT PAYLOAD:", body);

  try {
    await this.api.post("clients", body);

    this.toastr.success("Client added successfully!");

    this.closemodalPopup3();
    this.clientForm.reset();
    this.loadClients(); // refresh list
  } catch (err) {
    console.error("❌ ERROR WHILE ADDING CLIENT:", err);
    this.toastr.error("Failed to add client");
  }
}

}

