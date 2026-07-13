PROJECT_ROOT ?= $(CURDIR)
SOURCE_ROOT ?= $(PROJECT_ROOT)/references/downloads/bruneton-clear-sky-models-4df2ec6609bc-full/clear-sky-models-4df2ec6609bc0127a478bd34fff29c94352579cc
DIMENSIONAL_TYPES_ROOT ?= $(PROJECT_ROOT)/references/downloads/bruneton-clear-sky-models-4df2ec6609bc-full/submodules/dimensional_types-84e1e533/dimensional_types-84e1e53320cd89119d31ec87cfdc2b51825b0c4b
PROGRESS_BAR_ROOT ?= $(PROJECT_ROOT)/references/downloads/bruneton-clear-sky-models-4df2ec6609bc-full/submodules/progress_bar-b34cdce0/progress_bar-b34cdce09e505e36df90bd7e3b621949f5a52c24
DRIVER_ROOT := $(PROJECT_ROOT)/scripts/experiments/b1-directional-sky-radiance/external-reference
TARGET := $(DRIVER_ROOT)/build/b1_reference_driver

CXX ?= g++
CXXFLAGS ?= -O3 -DNDEBUG -Wall -Wextra -pedantic -std=c++11
CPPFLAGS := -I$(SOURCE_ROOT) -I$(DIMENSIONAL_TYPES_ROOT) -I$(PROGRESS_BAR_ROOT)

SOURCES := \
  $(DRIVER_ROOT)/b1_reference_driver.cc \
  $(SOURCE_ROOT)/atmosphere/atmosphere.cc \
  $(SOURCE_ROOT)/atmosphere/sun_direction.cc \
  $(SOURCE_ROOT)/atmosphere/measurement/measured_atmosphere.cc \
  $(SOURCE_ROOT)/atmosphere/model/bruneton/bruneton.cc \
  $(SOURCE_ROOT)/atmosphere/model/bruneton/core.cc \
  $(SOURCE_ROOT)/atmosphere/model/haber/haber.cc \
  $(SOURCE_ROOT)/atmosphere/model/hosek/ArHosekSkyModel.cc \
  $(SOURCE_ROOT)/atmosphere/model/hosek/hosek.cc \
  $(SOURCE_ROOT)/atmosphere/model/libradtran/libradtran.cc \
  $(SOURCE_ROOT)/atmosphere/model/nishita/nishita93.cc \
  $(SOURCE_ROOT)/atmosphere/model/nishita/nishita96.cc \
  $(SOURCE_ROOT)/atmosphere/model/oneal/oneal.cc \
  $(SOURCE_ROOT)/atmosphere/model/preetham/preetham.cc \
  $(SOURCE_ROOT)/physics/cie.cc \
  $(PROGRESS_BAR_ROOT)/util/progress_bar.cc

.PHONY: all clean

all: $(TARGET)

$(TARGET): $(SOURCES)
	mkdir -p $(dir $@)
	$(CXX) $(CPPFLAGS) $(CXXFLAGS) -pthread $(SOURCES) -o $@

clean:
	rm -rf $(DRIVER_ROOT)/build
