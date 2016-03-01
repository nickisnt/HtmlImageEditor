angular.module("imageOptimizer", [])
    .directive("imageAreaDir", function() {
        return {
            templateUrl: '/image-optimizer/directives/imageopt.html',
            link: function(scope, element, attrs) {
                var imageElem = element[0].getElementsByClassName('imageOptimizationImageArea')[0];
                scope.canvas = document.createElement("canvas");
                scope.canvas.style.display = 'block';
                imageElem.appendChild(scope.canvas);
                var histElem = element[0].getElementsByClassName('imageOptimizationHistArea')[0];
                scope.histoCanvas = document.createElement("canvas");
                scope.histoCanvas.className = "imageOptimizationHistoCanvas";
                histElem.appendChild(scope.histoCanvas);
            }
        };
    })
    .service("imageOptimizerService", function () {
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

        this.getHistogramData = function (data) {
            var grayVal;
            var histogramData = new Array();
            for (var i = 0; i < data.length; i += 4) {
                grayVal = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
                if (isNaN(histogramData[grayVal])) {
                    histogramData[grayVal] = 1;
                } else {
                    histogramData[grayVal]++;
                }
            }

            return histogramData;
        };

        this.getHistogramRedData = function (data) {
            var red = 0;
            return this._getColorHistogramData(data, red);
        };

        this.getHistogramGreenData = function (data) {
            var green = 1;
            return this._getColorHistogramData(data, green);
        };

        this.getHistogramBlueData = function (data) {
            var blue = 2;
            return this._getColorHistogramData(data, blue);
        };

        var _getColorHistogramData = function (data, colorInd) {
            var histogramData = new Array();
            for (var i = colorInd; i < data.length; i += 4) {
                if (isNaN(histogramData[data[i]])) {
                    histogramData[data[i]] = 1;
                } else {
                    histogramData[data[i]]++;
                }
            }
            return histogramData;
        };

        this.getHistogramDotData = function (data) {
            var grayVal;
            var histogramDotData = new Array();
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
    .controller("optCtrl", function ($scope, imageOptimizerService){
        var imgObj = new Image();

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
        };

        $scope.adjustImage = function (imageObj) {
            var context = $scope.canvas.getContext('2d');
            imageOptimizerService.flipCanvas(imgObj, $scope.canvas, $scope.vFlipM, $scope.hFlipM);
            var imageData = context.getImageData(0, 0, $scope.canvas.width, $scope.canvas.height);
            var whitePoint = _.parseInt($scope.white);

            if ($scope.optm === true) {
                imageOptimizerService.optimizeData(imageData.data, whitePoint);
            } else {
                this.processSliderChanges(imageData.data);
            }

            this.drawHistogram(imageData.data);
            // overwrite original image
            context.putImageData(imageData, 0, 0);
        };

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
                    blackFactor = blacks * ((bwVal * 0.95) / 255);//5
                } else if (bwVal < 75) {
                    blackFactor = blacks * ((bwVal * 0.88) / 255);//7 + 2
                } else if (bwVal < 100) {
                    blackFactor = blacks * ((bwVal * 0.77) / 255);//11 + 4
                } else if (bwVal < 125) {
                    blackFactor = blacks * ((bwVal * 0.60) / 255);//17 + 8
                } else if (bwVal < 150) {
                    blackFactor = blacks * ((bwVal * 0.44) / 255);// 25 +12
                } else if (bwVal < 175) {
                    blackFactor = blacks * ((bwVal * 0.3) / 255);// 37+16
                } else if (bwVal < 200) {
                    blackFactor = blacks * ((bwVal * 0.2) / 255);// 53 + 20
                } else if (bwVal < 225) {
                    blackFactor = blacks * ((bwVal * 0.1) / 255);// 73 + 24
                } else if (bwVal < 250) {
                    blackFactor = blacks * ((bwVal * 0.05) / 255);// 97
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

        $scope.drawHistogram = function (data) {
            var height = parseInt(document.documentElement.clientHeight - 111);
            var context = $scope.histoCanvas.getContext('2d');
            var grayVal;
            var histogramData = new Array();
            var maxVal = 0;
            var imageData;
            var data;
            var counter;

            for (var i = 0; i < data.length; i += 4) {
                grayVal = parseInt(0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2]);
                if (isNaN(histogramData[grayVal])) {
                    histogramData[grayVal] = 1;
                } else {
                    histogramData[grayVal]++;
                }

                if (histogramData[grayVal] > maxVal) {
                    maxVal = histogramData[grayVal];
                }
            }

            $scope.histoCanvas.height = height;
            $scope.histoCanvas.width = histogramData.length;

            imageData = context.getImageData(0, 0, $scope.histoCanvas.width, height);
            data = imageData.data;
            counter = 0;

            for (var i = 0; i < height; i++) {
                for (var j = 0; j < histogramData.length; j++) {
                    if ((histogramData[j] / maxVal) * height <= (height - i) || histogramData[j] === undefined) {
                        data[counter] = 240;
                        data[counter + 1] = 240;
                        data[counter + 2] = 240;
                        data[counter + 3] = 255;
                    } else {
                        data[counter] = 0;
                        data[counter + 1] = 0;
                        data[counter + 2] = 0;
                        data[counter + 3] = 255;
                    }
                    counter += 4;
                }
            }

            context.putImageData(imageData, 0, 0);
        };

        $scope.printHistogramDotData = function (data) {
            var dotData = imageOptimizerService.getHistogramDotData(data);

            dotData.forEach(function (elem) {
                console.log(elem);
            });
        };

        $scope.redraw = function () {
            $scope.adjustImage(imgObj);
        };

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

        function fileOnLoad (event) {
            if(event.target.result) {
                imgObj.onload = function () {
                    $scope.drawImage(imgObj);
                };

                imgObj.src = event.target.result;
            }
        }

        document.getElementById('imageInputMasterButton').addEventListener('change', handleFileSelect, false);
    });