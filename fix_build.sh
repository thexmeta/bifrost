#!/bin/bash
sed -i 's/ModelRequested:/OriginalModelRequested:/g' core/providers/openai/openai.go
sed -i 's/response.ExtraFields.ModelRequested = request.Model/response.ExtraFields.OriginalModelRequested = request.Model/g' core/providers/nvidianim/nvidianim.go
sed -i 's/nil, logger)/nil, logger, nil)/g' core/providers/nvidianim/nvidianim.go
