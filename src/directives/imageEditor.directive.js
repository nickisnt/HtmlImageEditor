/**
 * Html Image Editor Directive
 *
 * Author: Nicholas Arent
 * Date: 2016
 */
angular.module("HtmlImageEditor", [])
    .directive("imageEditorDirective", function() {
        return {
            templateUrl: '/directives/imageEditor.html',
            link: function(scope, element) {
                var imageElem = element[0].getElementsByClassName('imageEditorImageArea')[0];
                scope.canvas = document.createElement("canvas");
                scope.canvas.style.display = 'block';
                imageElem.appendChild(scope.canvas);
                var histElem = element[0].getElementsByClassName('imageEditorHistogramArea')[0];
                scope.histogramCanvas = document.createElement("canvas");
                scope.histogramCanvas.className = "imageEditorHistogramCanvas";
                histElem.appendChild(scope.histogramCanvas);
            }
        };
    })
    .service("imageEditorService", function () {
        /**
         * This is mostly used for simple images like snapshots of a whiteboard. It willincrease the
         * contrast of the image to make whiteboard snapshots less "muddy" looking.
         *
         * Data is canvas.getContext('2d').getImageData
         *
         * Whitepoint should be a value less than 255. Any pixel values above whitepoint will be
         * set to white.
         *
         * @param data
         * @param whitePoint
         * @returns {*}
         */
        this.optimizeData = function (data, whitePoint) {
            var grayVal;
            for (var i = 0; i < data.length; i += 4) {
                grayVal = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
                if (grayVal > whitePoint) {
                    // red
                    data[i] = 255;
                    // green
                    data[i + 1] = 255;
                    // blue
                    data[i + 2] = 255;
                }
            }
            return data;
        };


        /**
         * Returns a dot representation of the image's histogram.
         * Data is canvas.getContext('2d').getImageData
         *
         * @param data
         * @returns {Array}
         */
        this.getHistogramDotData = function (data) {
            var grayVal;
            var histogramDotData = [];
            for (var i = 0; i < data.length; i += 4) {
                grayVal = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
                if (histogramDotData[grayVal] === undefined) {
                    histogramDotData[grayVal] = ".";
                } else {
                    histogramDotData[grayVal] += ".";
                }
            }

            return histogramDotData;
        };

        /**
         * Flips the canvas vertically or horizontally depending on the boolean values of
         * bVertical and bHorizontal.
         *
         * originalImage is of type Image
         *
         * canvas is an HTML5 Canvas object
         *
         * bVertical is boolean true to flip image on the vertical axis
         *
         * bHorizontal is boolean true to flip image on the horizontal axis
         *
         * @param originalImage
         * @param canvas
         * @param bVertical
         * @param bHorizontal
         * @returns {*}
         */
        this.flipCanvas = function (originalImage, canvas, bVertical, bHorizontal) {
            var context = canvas.getContext("2d");
            var x = 0;
            var y = 0;
            context.save();

            if (bVertical && bHorizontal){
                context.scale(-1, -1);
                x = -canvas.width;
                y = -canvas.height;
            } else if (bVertical) {
                context.scale(1, -1);
                y = -canvas.height;
            }  else if (bHorizontal) {
                context.scale(-1, 1);
                x = -canvas.width;
            }

            context.drawImage(originalImage, x, y, canvas.width, canvas.height);
            context.restore();
            return canvas;
        };
    })
    .controller("imageEditorCtrl", function ($scope, imageEditorService){
        var imgObj = new Image();

        /**
         * Initial draw of the target image to the screen with default set values. Also
         * draws the histogram for the image data.
         *
         * imageObj is of type Image
         *
         * @param imageObj
         */
        $scope.drawImage = function (imageObj) {
            var dimension = parseInt(document.documentElement.clientHeight - 100);
            var maxWidth = parseInt(document.documentElement.clientWidth - 622);
            var x = 0;
            var y = 0;
            var tempHeight = dimension;
            var tempWidth = dimension;
            var context;
            var imageData;

            if (imageObj.width > imageObj.height) {
                tempHeight = (imageObj.height / imageObj.width) * tempWidth;
            } else {
                tempWidth = (imageObj.width / imageObj.height) * tempHeight;
            }

            if(tempWidth > maxWidth) {
                tempHeight = tempHeight * (maxWidth / tempWidth);
                tempWidth = maxWidth;
            }

            $scope.canvas.height = tempHeight;
            $scope.canvas.width = tempWidth;
            context = $scope.canvas.getContext('2d');
            context.drawImage(imageObj, x, y, tempWidth, tempHeight);
            imageData = context.getImageData(x, y, tempWidth, tempHeight);
            this.drawHistogram(imageData.data);

            //reset values
            $scope.white = 180;
            $scope.optm = false;
            $scope.bwm = false;
            $scope.brightness = 0;
            $scope.shadow = 0;
            $scope.highlight = 0;
            $scope.black = 0;
            $scope.vFlipM = 0;
            $scope.hFlipM = 0;
        };

        /**
         * Is responsible for adjusting the target image based on the image edit slider values.
         *
         * imageObj is of type Image
         *
         * imageData is canvas.getContext('2d').getImageData
         *
         * context is canvas.getContext('2d')
         *
         * @param imageObj
         * @param imageData
         * @param context
         */
        $scope.adjustImage = function (imageObj, imageData, context) {
            var whitePoint = _.parseInt($scope.white);

            if ($scope.optm === true) {
                imageEditorService.optimizeData(imageData.data, whitePoint);
            } else {
                this.processSliderChanges(imageData.data);
            }

            this.drawHistogram(imageData.data);
            // overwrite original image
            context.putImageData(imageData, 0, 0);
        };

        /**
         * Creates the low resolution preview image displayed in the editor based on
         * the editor slider values.
         *
         * imageObj is of type Image
         *
         * @param imageObj
         */
        $scope.createDisplayImage = function (imageObj) {
            var context = $scope.canvas.getContext('2d');
            imageEditorService.flipCanvas(imageObj, $scope.canvas, $scope.vFlipM, $scope.hFlipM);
            var imageData = context.getImageData(0, 0, $scope.canvas.width, $scope.canvas.height);

            $scope.adjustImage(imageObj, imageData, context);
        };

        /**
         * Creates the original resolution image for saving based on
         * the editor slider values.
         */
        $scope.createSaveImage = function () {
            var canvas = document.createElement("canvas");
            canvas.width = imgObj.width;
            canvas.height = imgObj.height;
            canvas.style.display = 'block';
            var context = canvas.getContext('2d');
            imageEditorService.flipCanvas(imgObj, canvas, $scope.vFlipM, $scope.hFlipM);
            var imageData = context.getImageData(0, 0, canvas.width, canvas.height);

            $scope.adjustImage(imgObj, imageData, context);

            var fullQualityImage = canvas.toDataURL("image/jpeg", 1.0);

            window.open(fullQualityImage,'Image','width=canvas.width,height=canvas.height,resizable=1');
        };

        /**
         * Modifies the raw image data based on the editor slider values.
         * This will iterate through every pixel of the image to make the adjustments.
         *
         * data is canvas.getContext('2d').getImageData
         *
         * @param data
         */
        $scope.processSliderChanges = function (data) {
            var brighter = _.parseInt($scope.brightness);
            var shadows = _.parseInt($scope.shadow);
            var highlights = _.parseInt($scope.highlight);
            var blacks = _.parseInt($scope.black);
            var bwVal, shadowFactor, highlightFactor, blackFactor, combinedFactors;

            for (var i = 0; i < data.length; i += 4) {
                bwVal = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
                shadowFactor = shadows * ((255 - bwVal) / 255);
                highlightFactor = highlights * (bwVal / 255);

                if (bwVal < 25) {
                    blackFactor = blacks * (bwVal / 255);
                } else if (bwVal < 50) {
                    blackFactor = blacks * ((bwVal * 0.95) / 255);
                } else if (bwVal < 75) {
                    blackFactor = blacks * ((bwVal * 0.88) / 255);
                } else if (bwVal < 100) {
                    blackFactor = blacks * ((bwVal * 0.77) / 255);
                } else if (bwVal < 125) {
                    blackFactor = blacks * ((bwVal * 0.60) / 255);
                } else if (bwVal < 150) {
                    blackFactor = blacks * ((bwVal * 0.44) / 255);
                } else if (bwVal < 175) {
                    blackFactor = blacks * ((bwVal * 0.3) / 255);
                } else if (bwVal < 200) {
                    blackFactor = blacks * ((bwVal * 0.2) / 255);
                } else if (bwVal < 225) {
                    blackFactor = blacks * ((bwVal * 0.1) / 255);
                } else if (bwVal < 250) {
                    blackFactor = blacks * ((bwVal * 0.05) / 255);
                } else {
                    blackFactor = 0;
                }

                combinedFactors = shadowFactor + highlightFactor + blackFactor + brighter;

                if ($scope.bwm === true) {
                    // red
                    data[i] = bwVal + combinedFactors;
                    // green
                    data[i + 1] = bwVal + combinedFactors;
                    // blue
                    data[i + 2] = bwVal + combinedFactors;
                } else {
                    // red
                    data[i] += combinedFactors;
                    // green
                    data[i + 1] += combinedFactors;
                    // blue
                    data[i + 2] += combinedFactors;
                }
            }
        };

        /**
         * Calculates histogram values from the image data and creates a canvas drawn graph representation
         * of the histogram data.
         *
         * data is canvas.getContext('2d').getImageData
         *
         * @param data
         */
        $scope.drawHistogram = function (data) {
            var height = parseInt(document.documentElement.clientHeight - 111);
            var context = $scope.histogramCanvas.getContext('2d');
            var histogramData = newHistogramArray(), maxVal = 0, grayVal, imageData, pixelGroupCounter, i, j;

            for (i = 0; i < data.length; i += 4) {
                grayVal = parseInt(0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2]);
                if (isNaN(histogramData[grayVal])) {
                    histogramData[grayVal] = 0;
                } else {
                    histogramData[grayVal]++;
                }

                if (histogramData[grayVal] > maxVal) {
                    maxVal = histogramData[grayVal];
                }
            }

            $scope.histogramCanvas.height = height;
            $scope.histogramCanvas.width = histogramData.length;

            imageData = context.getImageData(0, 0, $scope.histogramCanvas.width, height);
            data = imageData.data;
            pixelGroupCounter = 0;

            for (i = 0; i < height; i++) {
                for (j = 0; j < histogramData.length; j++) {
                    if ((histogramData[j] / maxVal) * height <= (height - i) || histogramData[j] === undefined) {
                        data[pixelGroupCounter] = 240;
                        data[pixelGroupCounter + 1] = 240;
                        data[pixelGroupCounter + 2] = 240;
                        data[pixelGroupCounter + 3] = 255;
                    } else {
                        data[pixelGroupCounter] = 0;
                        data[pixelGroupCounter + 1] = 0;
                        data[pixelGroupCounter + 2] = 0;
                        data[pixelGroupCounter + 3] = 255;
                    }
                    pixelGroupCounter += 4;
                }
            }

            context.putImageData(imageData, 0, 0);
        };

        function newHistogramArray() {
            var array = [];
            for (var i = 0; i < 255; i++) {
                array[i] = 0;
            }
            return array;
        }

        /**
         * Calculates the images histogram data and prints it to the console as
         * a dot graph.
         *
         * data is canvas.getContext('2d').getImageData
         *
         * @param data
         */
        $scope.printHistogramDotData = function (data) {
            var dotData = imageEditorService.getHistogramDotData(data);

            dotData.forEach(function (elem) {
                console.log(elem);
            });
        };

        /**
         * Called after each slider change. Updates the preview image and histogram based on
         * slider changes.
         *
         */
        $scope.redraw = function () {
            $scope.createDisplayImage(imgObj);
        };

        /**
         * Handler for file selection button.
         *
         * @param event
         */
        function handleFileSelect(event) {
            var files = event.target.files;
            var reader = new FileReader();

            if(event.target && event.target.files) {
                // process all File objects
                for(var i = 0; i < files.length; i++){
                    reader.onload = fileOnLoad;
                    reader.readAsDataURL(files[i]);
                }
            }
        }

        /**
         * Handler for FileReader object when image is selected and read in.
         *
         * @param event
         */
        function fileOnLoad (event) {
            if(event.target.result) {
                imgObj.onload = function () {
                    $scope.drawImage(imgObj);
                };

                imgObj.src = event.target.result;
            }
        }

        //Attach handler to file select button
        document.getElementById('imageInputMasterButton').addEventListener('change', handleFileSelect, false);
    });