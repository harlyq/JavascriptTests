(function(window) {
  function assert(cond) {
    if (!cond)
      debugger;
  }

  //-----------------------------------
  // value is some value
  // children is a an array of nodes, may be an array of null values
  var TreeNode = function(value, children) {
    this.value = value;
    this.children = children;
  };

  TreeNode.prototype.getTotalSize = function() {
    var count = 1; // have at least this
    if (this.children) {
      for (var i = 0; i < this.children.length; i++) {
        count += this.children[i].getTotalSize();
      }
    }

    return count;
  };

  // depth first indexing
  TreeNode.prototype.getTreeNode = function(index, currIndex) {
    currIndex = currIndex || 0;

    if (this.children) {
      for (var i = 0; i < this.children.length; i++) {
        var result = this.children[i].getTreeNode(index, currIndex);
        if (typeof(result) === "object")
          return result;
        else
          currIndex = result + 1;
      }
    }

    return index === currIndex ? this : currIndex;
  };

  // depth first indexing
  TreeNode.prototype.setTreeNode = function(index, other, currIndex) {
    currIndex = currIndex || 0;

    if (this.children) {
      for (var i = 0; i < this.children.length; i++) {
        var result = this.children[i].setTreeNode(index, other, currIndex);
        if (result == -1)
          return -1;
        else
          currIndex = result + 1;
      }
    }

    if (index == currIndex) {
      this.value = other.value;
      this.children = other.children;
      return -1;
    }
    return currIndex;
  };

  TreeNode.prototype.mutateThisNode = function() {
    assert(0); // must override;
  };

  TreeNode.prototype.mutate = function() {
    var nodeIndex = Math.floor(Math.random() * this.getTotalSize());
    var node = this.getTreeNode(nodeIndex);
    assert(typeof(node) === "object", "node is not an object");

    node.mutateThisNode();

    return this; // for chain
  };

  TreeNode.prototype.mateWith = function(other) {
    var childA = this.clone();
    var childB = other.clone();

    var aIndex = Math.floor(Math.random() * childA.getTotalSize());
    var bIndex = Math.floor(Math.random() * childB.getTotalSize());

    var aTreeNode = childA.getTreeNode(aIndex).clone();
    var bTreeNode = childB.getTreeNode(bIndex).clone();

    childA.setTreeNode(aIndex, bTreeNode);
    childB.setTreeNode(bIndex, aTreeNode);

    return [childA, childB];
  };

  TreeNode.prototype.clone = function() {
    assert(0); // must override
  };

  TreeNode.createRandomNetwork = function(maxDepth, createRandomFunc) {
    var newNetwork = null;
    var openSites = [{
      depth: 1,
      node: null
    }];

    while (openSites.length > 0) {
      var site = openSites.pop();

      for (i = 0; i < site.node.children.length; ++i) {
        var isLeafTreeNode = Math.random() < site.depth / maxDepth;
        var newTreeNode = createRandomFunc(isLeafTreeNode);

        if (newNetwork == null) {
          newNetwork = newTreeNode;
        } else {
          site.node.children[i] = newTreeNode;
        }

        if (!isLeafTreeNode) {
          openSites.push({
            depth: site.depth + 1,
            node: newTreeNode
          });
        }
      }
    }

    return newNetwork;
  };

  TreeNode.prototype.asString = function() {};

  //-----------------------------------
  // WeightsChromosome can be used when specializing a fixed list of weights
  // weights[] = elements (0,1]
  var WeightsChromosome = function(weights) {
    this.score = null;
    this.weights = weights;

    this.mutate();
  };

  WeightsChromosome.prototype.mutationRate = 0.1;

  WeightsChromosome.prototype.resetScore = function() {
    this.score = null;
  };

  WeightsChromosome.prototype.calcScore = function(fitnessFunc) {
    if (this.score !== null)
      return this.score;

    this.score = fitnessFunc(this);
    return this.score;
  };

  WeightsChromosome.prototype.mutate = function() {
    if (Math.random() > this.mutationRate)
      return false;

    var randomIndex = Math.floor(Math.random() * this.weights);
    this.weights[randomIndex] = Math.random();
  };

  WeightsChromosome.prototype.mateWith = function(other) {
    var numWeights = this.weights.length;
    assert(other.weights.length === numWeights);

    var splitIndex = Math.floor(Math.random() * numWeights);

    var newWeightsA = new Array(numWeights);
    var newWeightsB = new Array(numWeights);

    for (var i = 0; i < numWeights; ++i) {
      if (i < splitIndex) {
        newWeightsA[i] = this.weights[i];
        newWeightsB[i] = other.weights[i];
      } else {
        newWeightsA[i] = other.weights[i];
        newWeightsB[i] = this.weights[i];
      }
    }

    child1 = new WeightsChromosome(newWeightsA);
    child2 = new WeightsChromosome(newWeightsB);

    return [child1, child2];
  };

  WeightsChromosome.prototype.asString = function() {
    return this.weights.join(",");
  };

  //-----------------------------------
  // chromosome = newChromosomeFunc() ; returns a single randomized chromosome
  // float = fittnessFunc(chromosome) ; returns a score for a chromosome, lower is better
  var Population = function(size, newChromosomeFunc, fitnessFunc) {
    size = size || 20;
    this.newChromosomeFunc = newChromosomeFunc;
    this.fitnessFunc = fitnessFunc;

    this.scoreReset = true;
    this.chromosomes = [];
    this.size = size;
    this.matingSize = Math.max(2, size * this.mating);
    this.fill();
    this.sort();
  };

  Population.prototype.elitism = 2 / 6;
  Population.prototype.mating = 0.30;

  Population.prototype.fill = function() {
    while (this.chromosomes.length < this.size) {
      if (this.chromosomes.length < this.matingSize) {
        this.chromosomes.push(this.newChromosomeFunc());
      } else {
        this.mate();
      }
    }
  };

  Population.prototype.sort = function() {
    this.resetScore();

    var fitnessFunc = this.fitnessFunc;
    this.chromosomes.sort(function(a, b) {
      return a.calcScore(fitnessFunc) - b.calcScore(fitnessFunc); // ascending
    });
  };

  Population.prototype.kill = function() {
    var target = Math.floor(this.elitism * this.chromosomes.length);
    this.chromosomes.length = target;
  };

  Population.prototype.mate = function() {
    if (this.chromosomes.length <= 1)
      return;

    var key1 = Math.floor(Math.random() * this.chromosomes.length);
    var key2 = key1;

    while (key2 == key1) {
      key2 = Math.floor(Math.random() * this.chromosomes.length);
    }

    var children = this.chromosomes[key1].mateWith(this.chromosomes[key2]);
    this.chromosomes = this.chromosomes.concat(children);
  };

  Population.prototype.resetScore = function() {
    for (var i = this.chromosomes.length - 1; i >= 0; i--) {
      this.chromosomes[i].resetScore();
    }
    this.scoreReset = true;
  };

  Population.prototype.generation = function(log) {
    this.sort();
    this.kill();
    this.mate(); // mates 2 of the elite
    this.fill();
    this.sort(); // getBest() is valid
  };

  Population.prototype.getBest = function() {
    return this.chromosomes[0];
  };

  //-----------------------------------
  window.Population = Population;
  window.WeightsChromosome = WeightsChromosome;
  window.TreeNode = TreeNode;

})(window);