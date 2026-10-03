import { Component, inject } from '@angular/core';
import { Toast } from '../../services/toast';

/**
 * Displays the message of the app-wide {@link Toast} service
 * while it contains text.
 */
@Component({
  selector: 'app-toast',
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class ToastMessage {
  /** Toast service whose current message is rendered by the template. */
  protected toast = inject(Toast);
}
