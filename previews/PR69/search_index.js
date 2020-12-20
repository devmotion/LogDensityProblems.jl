var documenterSearchIndex = {"docs":
[{"location":"#Introduction-1","page":"Documentation","title":"Introduction","text":"","category":"section"},{"location":"#","page":"Documentation","title":"Documentation","text":"This package serves two purposes:","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"Introduce a common API for packages that operate on log densities, which for these purposes are black box mathbbR^n to mathbbR mappings. Using the interface of introduced in this package, you can query n, evaluate the log density and optionally its gradient, and determine if a particular object supports these methods using traits. This usage is relevant primarily for package developers who write generic algorithms that use (log) densities that correspond to posteriors and likelihoods, eg MCMC, MAP, ML. An example is DynamicHMC.jl. This is documented in the API section.\nMake it easier for users who want to perform inference using the above methods (and packages) to\ndefine their own log densities, either taking a vector of real numbers as input, or extracting and transforming parameters using the TransformVariables.jl package,\nobtain gradients of these log densities using one of the supported automatic differentiation packages of Julia.","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"This is documented in the next section, with a worked example.","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"For the purposes of this package, log densities are still valid when shifted by a constant that may be unknown, but is consistent within calls. This is necessary for Bayesian inference, where log posteriors are usually calculated up to a constant. See LogDensityProblems.logdensity for details.","category":"page"},{"location":"#Working-with-log-density-problems-1","page":"Documentation","title":"Working with log density problems","text":"","category":"section"},{"location":"#","page":"Documentation","title":"Documentation","text":"Consider an inference problem where IID draws are obtained from a normal distribution,","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"x_i sim N(mu sigma)","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"for i = 1 dots N. It can be shown that the log likelihood conditional on mu and sigma is","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"ell = -Nlog sigma - sum_i = 1^N frac(x-mu)^22sigma^2 =\n-Nleft( log sigma + fracS + (barx - mu)^22sigma^2 right)","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"where we have dropped constant terms, and defined the sufficient statistics","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"barx = frac1N sum_i = 1^N x_i","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"and","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"S = frac1N sum_i = 1^N (x_i - barx)^2","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"Finally, we use priors","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"mu sim N(0 5) sigma sim N(0 2)","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"which yield the log prior","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"-sigma^28 - mu^250","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"which is added to the log likelihood to obtain the log posterior.","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"It is useful to define a callable that implements this, taking some vector x as an input and calculating the summary statistics, then, when called with a NamedTuple containing the parameters, evaluating to the log posterior.","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"using Random; Random.seed!(1) # hide\nusing Statistics, UnPack # imported for our implementation\n\nstruct NormalPosterior{T} # contains the summary statistics\n    N::Int\n    x̄::T\n    S::T\nend\n\n# calculate summary statistics from a data vector\nfunction NormalPosterior(x::AbstractVector)\n    NormalPosterior(length(x), mean(x), var(x; corrected = false))\nend\n\n# define a callable that unpacks parameters, and evaluates the log likelihood\nfunction (problem::NormalPosterior)(θ)\n    @unpack μ, σ = θ\n    @unpack N, x̄, S = problem\n    loglikelihood = -N * (log(σ) + (S + abs2(μ - x̄)) / (2 * abs2(σ)))\n    logprior = - abs2(σ)/8 - abs2(μ)/50\n    loglikelihood + logprior\nend\n\nproblem = NormalPosterior(randn(100))\nnothing # hide","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"Let's try out the posterior calculation:","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"problem((μ = 0.0, σ = 1.0))","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"note: Note\nJust evaluating your log density function like above is a great way to test and benchmark your implementation. See the “Performance Tips” section of the Julia manual for optimization advice.","category":"page"},{"location":"#Using-the-TransformVariables-package-1","page":"Documentation","title":"Using the TransformVariables package","text":"","category":"section"},{"location":"#","page":"Documentation","title":"Documentation","text":"In our example, we require sigma  0, otherwise the problem is meaningless. However, many MCMC samplers prefer to operate on unconstrained spaces mathbbR^n. The TransformVariables package was written to transform unconstrained to constrained spaces, and help with the log Jacobian correction (more on that later). That package has detailed documentation, now we just define a transformation from a length 2 vector to a NamedTuple with fields μ (unconstrained) and σ > 0.","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"using LogDensityProblems, TransformVariables\nℓ = TransformedLogDensity(as((μ = asℝ, σ = asℝ₊)), problem)","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"Then we can query the dimension of this problem, and evaluate the log density:","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"LogDensityProblems.dimension(ℓ)\nLogDensityProblems.logdensity(ℓ, zeros(2))","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"note: Note\nBefore running time-consuming algorithms like MCMC, it is advisable to test and benchmark your log density evaluations separately. The same applies to LogDensityProblems.logdensity_and_gradient.","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"TransformedLogDensity","category":"page"},{"location":"#LogDensityProblems.TransformedLogDensity","page":"Documentation","title":"LogDensityProblems.TransformedLogDensity","text":"TransformedLogDensity(transformation, log_density_function)\n\nA problem in Bayesian inference. Vectors of length compatible with the dimension (obtained from transformation) are transformed into a general object θ (unrestricted type, but a named tuple is recommended for clean code), correcting for the log Jacobian determinant of the transformation.\n\nlog_density_function(θ) is expected to return real numbers. For zero densities or infeasible θs, -Inf or similar should be returned, but for efficiency of inference most methods recommend using transformation to avoid this. It is recommended that log_density_function is a callable object that also encapsulates the data for the problem.\n\nUse the property accessors ℓ.transformation and ℓ.log_density_function to access the arguments of ℓ::TransformedLogDensity, these are part of the public API.\n\nUsage note\n\nThis is the most convenient way to define log densities, as capabilities, logdensity, and dimension are automatically defined. To obtain a type that supports derivatives, use ADgradient.\n\n\n\n\n\n","category":"type"},{"location":"#Manual-unpacking-and-transformation-1","page":"Documentation","title":"Manual unpacking and transformation","text":"","category":"section"},{"location":"#","page":"Documentation","title":"Documentation","text":"If you prefer to implement the transformation yourself, you just have to define the following three methods for your problem: declare that it can evaluate log densities (but not their gradient, hence the 0 order), allow the dimension of the problem to be queried, and then finally code the density calculation with the transformation. (Note that using TransformedLogDensity takes care of all of these for you, as shown above).","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"function LogDensityProblems.capabilities(::Type{<:NormalPosterior})\n    LogDensityProblems.LogDensityOrder{0}()\nend\n\nLogDensityProblems.dimension(::NormalPosterior) = 2\n\nfunction LogDensityProblems.logdensity(problem::NormalPosterior, x)\n    μ, logσ = x\n    σ = exp(logσ)\n    problem((μ = μ, σ = σ)) + logσ\nend\nnothing # hide","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"LogDensityProblems.logdensity(problem, zeros(2))","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"Here we use the exponential function to transform from mathbbR to the positive reals, but this requires that we correct the log density with the logarithm of the Jacobian, which here happens to be log(sigma).","category":"page"},{"location":"#Automatic-differentiation-1","page":"Documentation","title":"Automatic differentiation","text":"","category":"section"},{"location":"#","page":"Documentation","title":"Documentation","text":"Using either definition, you can now transform to another object which is capable of evaluating the gradient, using automatic differentiation. The wrapper for this is","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"ADgradient","category":"page"},{"location":"#LogDensityProblems.ADgradient","page":"Documentation","title":"LogDensityProblems.ADgradient","text":"ADgradient(kind, P; kwargs...)\n\n\nWrap P using automatic differentiation to obtain a gradient.\n\nkind is usually a Val type with a symbol that refers to a package, for example\n\nADgradient(Val(:ForwardDiff), P)\n\nThe symbol can also be used directly as eg\n\nADgradient(:ForwardDiff, P)\n\nand should mostly be equivalent if the compiler manages to fold the constant.\n\nparent can be used to retrieve the original argument.\n\nSee methods(ADgradient). Note that some methods are defined conditionally on the relevant package being loaded.\n\n\n\n\n\nADgradient(:ForwardDiff, ℓ; chunk, gradientconfig)\nADgradient(Val(:ForwardDiff), ℓ; chunk, gradientconfig)\n\nWrap a log density that supports evaluation of Value to handle ValueGradient, using ForwardDiff.\n\nKeywords are passed on to ForwardDiff.GradientConfig to customize the setup. In particular, chunk size can be set with a chunk keyword argument (accepting an integer or a ForwardDiff.Chunk).\n\n\n\n\n\nADgradient(:Tracker, ℓ)\nADgradient(Val(:Tracker), ℓ)\n\nGradient using algorithmic/automatic differentiation via Tracker.\n\nThis package has been deprecated in favor of Zygote, but we keep the interface available.\n\n\n\n\n\nADgradient(:Zygote, ℓ)\nADgradient(Val(:Zygote), ℓ)\n\nGradient using algorithmic/automatic differentiation via Zygote.\n\n\n\n\n\n","category":"function"},{"location":"#","page":"Documentation","title":"Documentation","text":"Now observe that we can obtain gradients, too:","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"import ForwardDiff\n∇ℓ = ADgradient(:ForwardDiff, ℓ)\nLogDensityProblems.capabilities(∇ℓ)\nLogDensityProblems.logdensity_and_gradient(∇ℓ, zeros(2))","category":"page"},{"location":"#Manually-calculated-derivatives-1","page":"Documentation","title":"Manually calculated derivatives","text":"","category":"section"},{"location":"#","page":"Documentation","title":"Documentation","text":"If you prefer not to use automatic differentiation, you can wrap your own derivatives following the template","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"function LogDensityProblems.capabilities(::Type{<:NormalPosterior})\n    LogDensityProblems.LogDensityOrder{1}() # can do gradient\nend\n\nLogDensityProblems.dimension(::NormalPosterior) = 2 # for this problem\n\nfunction LogDensityProblems.logdensity_and_gradient(problem::NormalPosterior, x)\n    logdens = ...\n    grad = ...\n    logdens, grad\nend","category":"page"},{"location":"#Various-utilities-1","page":"Documentation","title":"Various utilities","text":"","category":"section"},{"location":"#","page":"Documentation","title":"Documentation","text":"You may find these utilities useful for debugging and optimization.","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"LogDensityProblems.stresstest\nLogDensityProblems.benchmark_ForwardDiff_chunks","category":"page"},{"location":"#LogDensityProblems.stresstest","page":"Documentation","title":"LogDensityProblems.stresstest","text":"stresstest(f, ℓ; N, rng, scale)\n\n\nTest ℓ with random values.\n\nN random vectors are drawn from a standard multivariate Cauchy distribution, scaled with scale (which can be a scalar or a conformable vector).\n\nEach random vector is then used as an argument in f(ℓ, ...). logdensity and logdensity_and_gradient are  recommended for f.\n\nIn case the call produces an error, the value is recorded as a failure, which are returned by the function.\n\nNot exported, but part of the API.\n\n\n\n\n\n","category":"function"},{"location":"#LogDensityProblems.benchmark_ForwardDiff_chunks","page":"Documentation","title":"LogDensityProblems.benchmark_ForwardDiff_chunks","text":"benchmark_ForwardDiff_chunks(ℓ; chunks, markprogress, x)\n\n\nBenchmark a log density problem with various chunk sizes using ForwardDiff.\n\nchunks, which defaults to all possible chunk sizes, determines the chunks that are tried.\n\nThe function returns chunk => time pairs, where time is the benchmarked runtime in seconds, as determined by BenchmarkTools.@belapsed. The gradient is evaluated at x (defaults to zeros).\n\nRuntime may be long because of tuned benchmarks, so when markprogress == true (the default), dots are printed to mark progress.\n\nThis function is not exported, but part of the API when ForwardDiff is imported.\n\n\n\n\n\n","category":"function"},{"location":"#log-density-api-1","page":"Documentation","title":"Log densities API","text":"","category":"section"},{"location":"#","page":"Documentation","title":"Documentation","text":"Use the functions below for evaluating gradients and querying their dimension and other information. These symbols are not exported, as they are mostly used by package developers and in any case would need to be imported or qualified to add methods to.","category":"page"},{"location":"#","page":"Documentation","title":"Documentation","text":"LogDensityProblems.capabilities\nLogDensityProblems.LogDensityOrder\nLogDensityProblems.dimension\nLogDensityProblems.logdensity\nLogDensityProblems.logdensity_and_gradient","category":"page"},{"location":"#LogDensityProblems.capabilities","page":"Documentation","title":"LogDensityProblems.capabilities","text":"capabilities(T)\n\n\nTest if the type (or a value, for convenience) supports the log density interface.\n\nWhen nothing is returned, it doesn't support this interface.  When LogDensityOrder{K}() is returned (typically with K == 0 or K = 1), derivatives up to order K are supported. All other return values are invalid.\n\nInterface description\n\nThe following methods need to be implemented for the interface:\n\ndimension returns the dimension of the domain,\nlogdensity evaluates the log density at a given point.\nlogdensity_and_gradient when K ≥ 1.\n\nSee also LogDensityProblems.stresstest for stress testing.\n\n\n\n\n\n","category":"function"},{"location":"#LogDensityProblems.LogDensityOrder","page":"Documentation","title":"LogDensityProblems.LogDensityOrder","text":"struct LogDensityOrder{K}\n\nA trait that means that a log density supports evaluating derivatives up to order K.\n\nTypical values for K are 0 (just the log density) and 1 (log density and gradient).\n\n\n\n\n\n","category":"type"},{"location":"#LogDensityProblems.dimension","page":"Documentation","title":"LogDensityProblems.dimension","text":"dimension(ℓ)\n\nDimension of the input vectors x for log density ℓ. See logdensity, logdensity_and_gradient.\n\nnote: Note\nThis function is distinct from TransformedVariables.dimension.\n\n\n\n\n\n","category":"function"},{"location":"#LogDensityProblems.logdensity","page":"Documentation","title":"LogDensityProblems.logdensity","text":"logdensity(ℓ, x)\n\nEvaluate the log density ℓ at x, which has length compatible with its dimension.\n\nReturn a real number, which may or may not be finite (can also be NaN). Non-finite values other than -Inf are invalid but do not error, caller should deal with these appropriately.\n\nNote about constants\n\nLog densities can be shifted by the same constant, as long as it is consistent between calls. For example,\n\nlogdensity(::StandardMultivariateNormal) = -0.5 * sum(abs2, x)\n\nis a valid implementation for some callable StandardMultivariateNormal that would implement the standard multivariate normal distribution (dimension k) with pdf\n\n(2pi)^-k2 e^-xx2\n\n\n\n\n\n","category":"function"},{"location":"#LogDensityProblems.logdensity_and_gradient","page":"Documentation","title":"LogDensityProblems.logdensity_and_gradient","text":"logdensity_and_gradient(ℓ, x)\n\nEvaluate the log density ℓ and its gradient at x, which has length compatible with its dimension.\n\nReturn two values:\n\nthe log density as real number, which equivalent to logdensity(ℓ, x)\nif the log density is finite, the gradient, a vector of real numbers, otherwise this  value is arbitrary and should be ignored.\n\nThe first argument (the log density) can be shifted by a constant, see the note for logdensity.\n\n\n\n\n\n","category":"function"}]
}
