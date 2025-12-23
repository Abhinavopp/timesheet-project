import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ModalModule, BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-employee-management',
  imports: [FontAwesomeModule,ModalModule],
  templateUrl: './employee-management.html',
  styleUrl: './employee-management.css'
})
export class EmployeeManagement {
  @ViewChild('clientModal') openclientTemplate!: TemplateRef<any>;
  modalRef?: BsModalRef;

  constructor(
    private modalService: BsModalService,
  ) {

  }
  openclientPopup() {
    this.modalRef = this.modalService.show(this.openclientTemplate, {
      class: 'custom-modal-width'
    });
  }

  closemodalPopup3() {
    this.modalRef?.hide();
  }
}
