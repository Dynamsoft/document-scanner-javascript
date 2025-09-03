import { Component, OnInit } from '@angular/core';
import { DocumentScanner } from 'dynamsoft-document-scanner';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  ngOnInit(): void {
    const initScanner = async () => {
      const documentScanner = new DocumentScanner({
        license: 'YOUR_LICENSE_KEY_HERE',
      });

      const result = await documentScanner.launch();
      if (result?.correctedImageResult) {
        const resultsDiv = document.getElementById('results');
        if (resultsDiv) {
          resultsDiv.innerHTML = '';
          const canvas = result.correctedImageResult.toCanvas();
          canvas.style.maxWidth = '100%';
          canvas.style.height = 'auto';
          resultsDiv.appendChild(canvas);
        }
      }
    };

    initScanner().catch((error) => {
      console.error('Error initializing document scanner:', error);
    });
  }
}
