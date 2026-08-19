# HKIA Flower Tracker

A beautiful desktop application for tracking the HKIA Flower collection.

## For Users (How to download and play)

If you just want to run the app, head over to the **Releases** section on the right side of the GitHub page. 
Download the `.exe` file provided there and double-click it to run. No installation required!

## For Developers (How to build from source)

If you want to view or modify the code, you'll need [Node.js](https://nodejs.org/) installed on your computer.

### 1. Clone the repository
```bash
git clone https://github.com/YOUR-USERNAME/HKIA-Flower-Tracker.git
cd HKIA-Flower-Tracker
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the app in development mode
```bash
npm start
```

### 4. Build the executable
To create a standalone `.exe` file that you can share with others, run:
```bash
npm run build:portable
```
The compiled executable will be located in the `dist` folder.
