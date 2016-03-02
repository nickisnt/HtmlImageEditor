# HtmlImageEditor
TL;DR: HTML/AngularJS/Javascript Based Image Editor allowing basic editing such as adjusting shadows, highlights, flipping, rotating and other functionality.

Author: Nicholas Arent

Date: 2016

The goal behind this application is to bring basic image/photo editing to the web and done purely in HTML/AngularJS/Javascript. Currently most powerful editors are written as flash apps. I desire to do the same in HTML.
This is the start and hopefully it can grow into a full application. I am also attempting to write this in a modular way in AngularJS so that this project can be used as a library in other projects as opposed to just being an application. For performance reasons I am staying away from JQuery and using AngularJS data binding to read/set data on DOM elements.


Requirements:

AngularJS (Latest version 1 release, tested with 1.5)

Lodash (Latest version, tested with 4.6)



Current Supported Functionality:

-Black and White

-Open/Close Shadows

-Open/Close Hightlights

-Open/Close Black Point

-Flip Horizontal and Vertical

-Auto Optimize - this is intended for optimizing low fidelity images such as whiteboard snapshots.

-Image read and partial save. Save needs user interaction because the browser cannot save the image. So the high res edited image is opened in a new window for the user to save themself.



See the index.js file for an example of integrating this directive into an application.
