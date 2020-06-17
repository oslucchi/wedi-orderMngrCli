import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";

@Component({
  selector: 'app-msg-box',
  templateUrl: './msg-box.component.html',
  styleUrls: ['./msg-box.component.css']
})
export class MsgBoxComponent implements OnInit {
  public buttons: boolean[];
  public choice: string;
  public description: string;
  public message: string;
  public form: FormGroup;

  constructor(private fb: FormBuilder,
              private dialogRef: MatDialogRef<MsgBoxComponent>,
              @Inject(MAT_DIALOG_DATA) data) 
  {
    this.description = data.description;
    this.buttons = [ false, false, false ];
  }

  ngOnInit() {
    this.form = this.fb.group({
      description: [this.description, []],
      message: [this.message, []]
    });
  }

  save() {
    this.dialogRef.close(this.form.value);
  }
  close() {
    this.dialogRef.close();
  }
  cancel() {
    this.dialogRef.close();
  }
}
