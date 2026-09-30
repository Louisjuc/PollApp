import { Component, inject } from '@angular/core';
import { Toast } from '../../services/toast';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class ToastMessage {
  protected toast = inject(Toast);
}
