#!/usr/bin/env python3
"""
Setup script for Iraqi Administrative Divisions Map

This script sets up the entire environment for the map application:
1. Checks Python dependencies
2. Converts shapefiles to GeoJSON
3. Provides instructions for running the Node.js application

Usage:
    python setup.py
"""

import subprocess
import sys
import os
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 7):
        print("❌ Python 3.7 or higher is required!")
        print(f"Current version: {sys.version}")
        return False
    print(f"✅ Python version: {sys.version}")
    return True

def install_python_dependencies():
    """Install required Python packages"""
    print("\n📦 Installing Python dependencies...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ])
        print("✅ Python dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install Python dependencies: {e}")
        print("You can try installing manually with:")
        print("pip install geopandas fiona pyproj shapely rtree")
        return False

def run_conversion():
    """Run the shapefile to GeoJSON conversion"""
    print("\n🗺️  Converting shapefiles to GeoJSON...")
    try:
        subprocess.check_call([sys.executable, "convert_shapefiles.py"])
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Conversion failed: {e}")
        return False

def check_node_installation():
    """Check if Node.js is installed"""
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Node.js version: {result.stdout.strip()}")
            return True
        else:
            print("❌ Node.js not found!")
            return False
    except FileNotFoundError:
        print("❌ Node.js not found!")
        return False

def install_node_dependencies():
    """Install Node.js dependencies"""
    print("\n📦 Installing Node.js dependencies...")
    try:
        subprocess.check_call(["npm", "install"])
        print("✅ Node.js dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install Node.js dependencies: {e}")
        return False
    except FileNotFoundError:
        print("❌ npm not found! Please install Node.js first.")
        return False

def main():
    """Main setup function"""
    print("🚀 Iraqi Administrative Divisions Map - Setup")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Install Python dependencies
    if not install_python_dependencies():
        print("\n⚠️  Python dependency installation failed.")
        print("You can continue with manual installation or fix the issues above.")
        response = input("Continue anyway? (y/N): ").lower()
        if response != 'y':
            sys.exit(1)
    
    # Convert shapefiles
    if not run_conversion():
        print("\n⚠️  Shapefile conversion failed.")
        print("Please check that the 'irq-administrative-divisions-shapefiles' directory exists")
        print("and contains the required .shp files.")
        sys.exit(1)
    
    # Check Node.js
    if not check_node_installation():
        print("\n⚠️  Node.js is required to run the web application.")
        print("Please install Node.js from: https://nodejs.org/")
        print("After installing Node.js, run: npm install")
        sys.exit(1)
    
    # Install Node.js dependencies
    if not install_node_dependencies():
        print("\n⚠️  Node.js dependency installation failed.")
        sys.exit(1)
    
    # Success message
    print("\n🎉 Setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Start the application: npm start")
    print("2. Open your browser to: http://localhost:5000")
    print("3. Explore the interactive map!")
    
    print("\n💡 Development mode:")
    print("   npm run dev  (auto-restart on file changes)")

if __name__ == "__main__":
    main()
